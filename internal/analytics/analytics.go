package analytics

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
	"github.com/svgstat/svgstat/internal/cache"
	"github.com/svgstat/svgstat/internal/geoip"
	"github.com/svgstat/svgstat/internal/project"
)

type Analytics struct {
	cache       *cache.Cache
	projectRepo project.Repository
	geoIP       *geoip.GeoIP
}

type RequestData struct {
	ProjectID  string `json:"projectId"`
	IP         string `json:"ip"`
	UserAgent  string `json:"userAgent"`
	Referrer   string `json:"referrer"`
	Path       string `json:"path"`
	Country    string `json:"country"`
	Region     string `json:"region"`
	City       string `json:"city"`
	DeviceType string `json:"deviceType"`
	Browser    string `json:"browser"`
	IsBot      bool   `json:"isBot"`
}

type DailyStats struct {
	ProjectID string           `json:"projectId"`
	Date      string           `json:"date"`
	PV        int64            `json:"pv"`
	UV        int64            `json:"uv"`
	Requests  int64            `json:"requests"`
	Bots      int64            `json:"bots"`
	Referrers map[string]int64 `json:"referrers"`
	Countries map[string]int64 `json:"countries"`
	Regions   map[string]int64 `json:"regions"`
	Cities    map[string]int64 `json:"cities"`
	Devices   map[string]int64 `json:"devices"`
	Browsers  map[string]int64 `json:"browsers"`
	Paths     map[string]int64 `json:"paths"`
	IPs       map[string]int64 `json:"ips"`
}

type VisitorDetail struct {
	VisitorID   string `json:"visitorId"`
	IP          string `json:"ip"`
	Path        string `json:"path"`
	Referrer    string `json:"referrer"`
	Country     string `json:"country"`
	Region      string `json:"region"`
	City        string `json:"city"`
	DeviceType  string `json:"deviceType"`
	Browser     string `json:"browser"`
	Requests    int64  `json:"requests"`
	FirstSeenAt string `json:"firstSeenAt"`
	LastSeenAt  string `json:"lastSeenAt"`
}

type VisitorList struct {
	ProjectID  string          `json:"projectId"`
	Date       string          `json:"date"`
	Page       int             `json:"page"`
	PageSize   int             `json:"pageSize"`
	Total      int             `json:"total"`
	TotalPages int             `json:"totalPages"`
	Items      []VisitorDetail `json:"items"`
}

type VisitorQuery struct {
	Page     int
	PageSize int
	Device   string
	Browser  string
	Path     string
	Sort     string
}

func New(cache *cache.Cache, projectRepo project.Repository, geoIP *geoip.GeoIP) *Analytics {
	return &Analytics{
		cache:       cache,
		projectRepo: projectRepo,
		geoIP:       geoIP,
	}
}

func (a *Analytics) TrackRequest(ctx context.Context, req *http.Request, projectID string) error {
	data := a.extractRequestData(req, projectID)

	date := time.Now().Format("2006-01-02")
	now := time.Now().UTC().Format(time.RFC3339)
	pipe := a.cache.Pipeline()

	pvKey := cache.BuildKey("project", projectID, "pv", date)
	requestsKey := cache.BuildKey("project", projectID, "requests", date)
	botsKey := cache.BuildKey("project", projectID, "bots", date)
	uvSetKey := cache.BuildKey("project", projectID, "uvset", date)
	referrerKey := cache.BuildKey("project", projectID, "referrer", date)
	countryKey := cache.BuildKey("project", projectID, "country", date)
	regionKey := cache.BuildKey("project", projectID, "region", date)
	cityKey := cache.BuildKey("project", projectID, "city", date)
	deviceKey := cache.BuildKey("project", projectID, "device", date)
	browserKey := cache.BuildKey("project", projectID, "browser", date)
	pathKey := cache.BuildKey("project", projectID, "path", date)
	ipKey := cache.BuildKey("project", projectID, "ip", date)
	visitorsKey := cache.BuildKey("project", projectID, "visitors", date)

	pipe.Incr(ctx, requestsKey)
	if data.IsBot {
		pipe.Incr(ctx, botsKey)
	} else {
		pipe.Incr(ctx, pvKey)
		visitorHash := a.hashVisitor(data.IP, data.UserAgent)
		visitorKey := cache.BuildKey("project", projectID, "visitor", date, visitorHash)
		pipe.SAdd(ctx, uvSetKey, visitorHash)
		pipe.SAdd(ctx, visitorsKey, visitorHash)
		pipe.HSetNX(ctx, visitorKey, "visitor_id", visitorHash)
		pipe.HSetNX(ctx, visitorKey, "first_seen_at", now)
		pipe.HSet(ctx, visitorKey, map[string]interface{}{
			"last_seen_at": now,
			"ip":           data.IP,
			"path":         data.Path,
			"referrer":     data.Referrer,
			"country":      data.Country,
			"region":       data.Region,
			"city":         data.City,
			"device_type":  data.DeviceType,
			"browser":      data.Browser,
		})
		pipe.HIncrBy(ctx, visitorKey, "requests", 1)
	}

	if data.Referrer != "" {
		pipe.HIncrBy(ctx, referrerKey, data.Referrer, 1)
	}
	if data.Country != "" {
		pipe.HIncrBy(ctx, countryKey, data.Country, 1)
	}
	if data.Region != "" {
		pipe.HIncrBy(ctx, regionKey, data.Region, 1)
	}
	if data.City != "" {
		pipe.HIncrBy(ctx, cityKey, data.City, 1)
	}
	if data.DeviceType != "" {
		pipe.HIncrBy(ctx, deviceKey, data.DeviceType, 1)
	}
	if data.Browser != "" {
		pipe.HIncrBy(ctx, browserKey, data.Browser, 1)
	}
	if data.Path != "" {
		pipe.HIncrBy(ctx, pathKey, data.Path, 1)
	}
	if data.IP != "" {
		pipe.HIncrBy(ctx, ipKey, data.IP, 1)
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		log.Error().Err(err).Str("project_id", projectID).Msg("Failed to track analytics")
		return fmt.Errorf("failed to track analytics: %w", err)
	}

	return nil
}

func (a *Analytics) GetTodayStats(ctx context.Context, projectID string) (*DailyStats, error) {
	date := time.Now().Format("2006-01-02")
	return a.GetStats(ctx, projectID, date)
}

func (a *Analytics) GetStats(ctx context.Context, projectID, date string) (*DailyStats, error) {
	pipe := a.cache.Pipeline()

	pvKey := cache.BuildKey("project", projectID, "pv", date)
	requestsKey := cache.BuildKey("project", projectID, "requests", date)
	botsKey := cache.BuildKey("project", projectID, "bots", date)
	uvSetKey := cache.BuildKey("project", projectID, "uvset", date)
	referrerKey := cache.BuildKey("project", projectID, "referrer", date)
	countryKey := cache.BuildKey("project", projectID, "country", date)
	regionKey := cache.BuildKey("project", projectID, "region", date)
	cityKey := cache.BuildKey("project", projectID, "city", date)
	deviceKey := cache.BuildKey("project", projectID, "device", date)
	browserKey := cache.BuildKey("project", projectID, "browser", date)
	pathKey := cache.BuildKey("project", projectID, "path", date)
	ipKey := cache.BuildKey("project", projectID, "ip", date)

	pvCmd := pipe.Get(ctx, pvKey)
	requestsCmd := pipe.Get(ctx, requestsKey)
	botsCmd := pipe.Get(ctx, botsKey)
	uvCmd := pipe.SCard(ctx, uvSetKey)
	referrersCmd := pipe.HGetAll(ctx, referrerKey)
	countriesCmd := pipe.HGetAll(ctx, countryKey)
	regionsCmd := pipe.HGetAll(ctx, regionKey)
	citiesCmd := pipe.HGetAll(ctx, cityKey)
	devicesCmd := pipe.HGetAll(ctx, deviceKey)
	browsersCmd := pipe.HGetAll(ctx, browserKey)
	pathsCmd := pipe.HGetAll(ctx, pathKey)
	ipsCmd := pipe.HGetAll(ctx, ipKey)

	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}

	stats := &DailyStats{
		ProjectID: projectID,
		Date:      date,
		Referrers: make(map[string]int64),
		Countries: make(map[string]int64),
		Regions:   make(map[string]int64),
		Cities:    make(map[string]int64),
		Devices:   make(map[string]int64),
		Browsers:  make(map[string]int64),
		Paths:     make(map[string]int64),
		IPs:       make(map[string]int64),
	}

	stats.PV, _ = pvCmd.Int64()
	stats.Requests, _ = requestsCmd.Int64()
	stats.Bots, _ = botsCmd.Int64()
	stats.UV = uvCmd.Val()

	for k, v := range referrersCmd.Val() {
		stats.Referrers[k], _ = parseToInt64(v)
	}
	for k, v := range countriesCmd.Val() {
		stats.Countries[k], _ = parseToInt64(v)
	}
	for k, v := range regionsCmd.Val() {
		stats.Regions[k], _ = parseToInt64(v)
	}
	for k, v := range citiesCmd.Val() {
		stats.Cities[k], _ = parseToInt64(v)
	}
	for k, v := range devicesCmd.Val() {
		stats.Devices[k], _ = parseToInt64(v)
	}
	for k, v := range browsersCmd.Val() {
		stats.Browsers[k], _ = parseToInt64(v)
	}
	for k, v := range pathsCmd.Val() {
		stats.Paths[k], _ = parseToInt64(v)
	}
	for k, v := range ipsCmd.Val() {
		stats.IPs[k], _ = parseToInt64(v)
	}

	return stats, nil
}

func (a *Analytics) GetTodayVisitors(ctx context.Context, projectID string, query VisitorQuery) (*VisitorList, error) {
	date := time.Now().Format("2006-01-02")
	return a.GetVisitors(ctx, projectID, date, query)
}

func (a *Analytics) GetVisitors(ctx context.Context, projectID, date string, query VisitorQuery) (*VisitorList, error) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 {
		query.PageSize = 20
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	visitorIDs, err := a.cache.GetClient().SMembers(ctx, cache.BuildKey("project", projectID, "visitors", date)).Result()
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to get visitors: %w", err)
	}

	details, err := a.getVisitorDetails(ctx, projectID, date, visitorIDs)
	if err != nil {
		return nil, err
	}

	details = filterVisitorDetails(details, query)
	sortVisitorDetails(details, query.Sort)

	total := len(details)
	totalPages := 0
	if total > 0 {
		totalPages = (total + query.PageSize - 1) / query.PageSize
	}
	if totalPages == 0 {
		query.Page = 1
	} else if query.Page > totalPages {
		query.Page = totalPages
	}

	start := (query.Page - 1) * query.PageSize
	end := start + query.PageSize
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	items := make([]VisitorDetail, 0)
	if start < end {
		items = details[start:end]
	}

	return &VisitorList{
		ProjectID:  projectID,
		Date:       date,
		Page:       query.Page,
		PageSize:   query.PageSize,
		Total:      total,
		TotalPages: totalPages,
		Items:      items,
	}, nil
}

func (a *Analytics) extractRequestData(req *http.Request, projectID string) *RequestData {
	data := &RequestData{
		ProjectID: projectID,
		IP:        getRealIP(req),
		UserAgent: req.UserAgent(),
		Referrer:  req.Referer(),
		Path:      req.URL.Path,
	}

	data.IsBot = a.isBot(data.UserAgent)
	data.DeviceType = a.detectDeviceType(data.UserAgent)
	data.Browser = a.detectBrowser(data.UserAgent)

	if a.geoIP != nil {
		location, err := a.geoIP.Lookup(data.IP)
		if err == nil {
			data.Country = location.CountryISO
			data.Region = location.Region
			data.City = location.City
		}
	}

	return data
}

func (a *Analytics) hashVisitor(ip, userAgent string) string {
	hash := sha256.New()
	hash.Write([]byte(ip + "|" + userAgent))
	return hex.EncodeToString(hash.Sum(nil))[:16]
}

func (a *Analytics) isBot(userAgent string) bool {
	botKeywords := []string{
		"bot", "crawler", "spider", "scraper", "curl", "wget",
		"googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
		"yandexbot", "sogou", "exabot", "facebot", "ia_archiver",
	}

	userAgentLower := strings.ToLower(userAgent)
	for _, keyword := range botKeywords {
		if strings.Contains(userAgentLower, keyword) {
			return true
		}
	}
	return false
}

func (a *Analytics) detectDeviceType(userAgent string) string {
	uaLower := strings.ToLower(userAgent)

	if strings.Contains(uaLower, "iphone") || strings.Contains(uaLower, "android") ||
		strings.Contains(uaLower, "mobile") {
		return "mobile"
	}
	if strings.Contains(uaLower, "ipad") || strings.Contains(uaLower, "tablet") {
		return "tablet"
	}
	return "desktop"
}

func (a *Analytics) detectBrowser(userAgent string) string {
	uaLower := strings.ToLower(userAgent)

	if strings.Contains(uaLower, "chrome") && !strings.Contains(uaLower, "edg") {
		return "chrome"
	}
	if strings.Contains(uaLower, "firefox") {
		return "firefox"
	}
	if strings.Contains(uaLower, "safari") && !strings.Contains(uaLower, "chrome") {
		return "safari"
	}
	if strings.Contains(uaLower, "edg") {
		return "edge"
	}
	if strings.Contains(uaLower, "opera") || strings.Contains(uaLower, "opr") {
		return "opera"
	}
	return "other"
}

func getRealIP(req *http.Request) string {
	if xff := req.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	if xri := req.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	host, _, _ := net.SplitHostPort(req.RemoteAddr)
	return host
}

func parseToInt64(s string) (int64, error) {
	var result int64
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}

func (a *Analytics) getVisitorDetails(ctx context.Context, projectID, date string, visitorIDs []string) ([]VisitorDetail, error) {
	if len(visitorIDs) == 0 {
		return []VisitorDetail{}, nil
	}

	visitorPipe := a.cache.Pipeline()
	visitorDetailCmds := make(map[string]*redis.MapStringStringCmd, len(visitorIDs))
	for _, visitorID := range visitorIDs {
		visitorKey := cache.BuildKey("project", projectID, "visitor", date, visitorID)
		visitorDetailCmds[visitorID] = visitorPipe.HGetAll(ctx, visitorKey)
	}

	if _, err := visitorPipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to get visitor details: %w", err)
	}

	details := make([]VisitorDetail, 0, len(visitorIDs))
	for _, visitorID := range visitorIDs {
		detail := buildVisitorDetail(visitorID, visitorDetailCmds[visitorID].Val())
		if detail.Requests == 0 {
			continue
		}
		details = append(details, detail)
	}

	sort.Slice(details, func(i, j int) bool {
		leftTime, _ := time.Parse(time.RFC3339, details[i].LastSeenAt)
		rightTime, _ := time.Parse(time.RFC3339, details[j].LastSeenAt)
		if leftTime.Equal(rightTime) {
			return details[i].Requests > details[j].Requests
		}
		return leftTime.After(rightTime)
	})

	return details, nil
}

func filterVisitorDetails(details []VisitorDetail, query VisitorQuery) []VisitorDetail {
	device := strings.TrimSpace(strings.ToLower(query.Device))
	browser := strings.TrimSpace(strings.ToLower(query.Browser))
	path := strings.TrimSpace(strings.ToLower(query.Path))

	if device == "" && browser == "" && path == "" {
		return details
	}

	filtered := make([]VisitorDetail, 0, len(details))
	for _, detail := range details {
		if device != "" && strings.ToLower(detail.DeviceType) != device {
			continue
		}
		if browser != "" && strings.ToLower(detail.Browser) != browser {
			continue
		}
		if path != "" && !strings.Contains(strings.ToLower(detail.Path), path) {
			continue
		}
		filtered = append(filtered, detail)
	}

	return filtered
}

func sortVisitorDetails(details []VisitorDetail, sortBy string) {
	switch sortBy {
	case "requests_asc":
		sort.Slice(details, func(i, j int) bool {
			if details[i].Requests == details[j].Requests {
				return details[i].LastSeenAt < details[j].LastSeenAt
			}
			return details[i].Requests < details[j].Requests
		})
	case "requests_desc":
		sort.Slice(details, func(i, j int) bool {
			if details[i].Requests == details[j].Requests {
				return details[i].LastSeenAt > details[j].LastSeenAt
			}
			return details[i].Requests > details[j].Requests
		})
	case "first_seen_asc":
		sort.Slice(details, func(i, j int) bool {
			return details[i].FirstSeenAt < details[j].FirstSeenAt
		})
	case "first_seen_desc":
		sort.Slice(details, func(i, j int) bool {
			return details[i].FirstSeenAt > details[j].FirstSeenAt
		})
	default:
		sort.Slice(details, func(i, j int) bool {
			if details[i].LastSeenAt == details[j].LastSeenAt {
				return details[i].Requests > details[j].Requests
			}
			return details[i].LastSeenAt > details[j].LastSeenAt
		})
	}
}

func buildVisitorDetail(visitorID string, data map[string]string) VisitorDetail {
	detail := VisitorDetail{
		VisitorID:   visitorID,
		IP:          data["ip"],
		Path:        data["path"],
		Referrer:    data["referrer"],
		Country:     data["country"],
		Region:      data["region"],
		City:        data["city"],
		DeviceType:  data["device_type"],
		Browser:     data["browser"],
		FirstSeenAt: data["first_seen_at"],
		LastSeenAt:  data["last_seen_at"],
	}
	detail.Requests, _ = parseToInt64(data["requests"])
	return detail
}

func (d VisitorDetail) MarshalJSON() ([]byte, error) {
	type Alias VisitorDetail
	return json.Marshal(Alias(d))
}

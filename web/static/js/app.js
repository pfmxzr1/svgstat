function createEmptyProjectStats() {
    return {
        projectId: '',
        date: '',
        pv: 0,
        uv: 0,
        requests: 0,
        bots: 0,
        referrers: {},
        countries: {},
        regions: {},
        cities: {},
        devices: {},
        browsers: {},
        paths: {},
        ips: {},
        visitors: []
    };
}

function createEmptyVisitorPage() {
    return {
        projectId: '',
        date: '',
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        items: []
    };
}

function createDefaultVisitorFilters() {
    return {
        device: '',
        browser: '',
        path: '',
        sort: 'last_seen_desc',
        pageSize: 20
    };
}

// Define the Alpine component
function spaApp() {
    return {
        lang: localStorage.getItem('svgstat-lang') || ((navigator.language || 'en').toLowerCase().startsWith('en') ? 'en' : 'zh'),
        user: null,
        currentPage: 'home',
        projects: [],
        loading: false,
        creating: false,
        showCreateModal: false,
        showCodeModal: false,
        expandedVisitorId: null,
        selectedProject: null,
        lastLoadedStatsProjectId: '',
        lastLoadedVisitorsRequestKey: '',
        projectStats: createEmptyProjectStats(),
        visitorsPage: createEmptyVisitorPage(),
        visitorFilters: createDefaultVisitorFilters(),
        loadingStats: false,
        loadingVisitors: false,
        freePageId: '',
        toast: { show: false, message: '', type: 'success', timer: null },
        codeSettings: {
            counterName: 'visits',
            counterLabel: 'Visits',
            counterColor: '',
            badgeName: 'downloads',
            badgeLabel: 'Downloads',
            badgeColor: '',
            badgeStyle: '',
            homepageUrl: ''
        },
        newProject: {
            name: '',
            slug: '',
            description: ''
        },
        loginForm: {
            email: '',
            password: ''
        },
        registerForm: {
            name: '',
            email: '',
            password: ''
        },
        loginLoading: false,
        registerLoading: false,
        loginError: null,
        registerError: null,
        registerSuccess: null,

        t(key) {
            return translations[this.lang]?.[key] || translations.en[key] || key;
        },

        init() {
            this.$watch('lang', (val) => {
                localStorage.setItem('svgstat-lang', val);
                document.documentElement.lang = val;
            });
            document.documentElement.lang = this.lang;
            this.parseRoute();
            window.addEventListener('popstate', () => this.parseRoute());
            this.checkAuth();
            if (this.currentPage === 'dashboard' || this.currentPage === 'project-detail') {
                this.loadProjects();
            }
        },

        parseRoute() {
            const path = window.location.pathname;
            if (path === '/login') {
                this.currentPage = 'login';
                this.selectedProject = null;
                this.lastLoadedStatsProjectId = '';
                this.lastLoadedVisitorsRequestKey = '';
                this.showCodeModal = false;
                this.expandedVisitorId = null;
                this.projectStats = createEmptyProjectStats();
                this.visitorsPage = createEmptyVisitorPage();
                this.visitorFilters = createDefaultVisitorFilters();
            } else if (path === '/register') {
                this.currentPage = 'register';
                this.selectedProject = null;
                this.lastLoadedStatsProjectId = '';
                this.lastLoadedVisitorsRequestKey = '';
                this.showCodeModal = false;
                this.expandedVisitorId = null;
                this.projectStats = createEmptyProjectStats();
                this.visitorsPage = createEmptyVisitorPage();
                this.visitorFilters = createDefaultVisitorFilters();
            } else if (path === '/dashboard') {
                this.currentPage = 'dashboard';
                this.selectedProject = null;
                this.lastLoadedStatsProjectId = '';
                this.lastLoadedVisitorsRequestKey = '';
                this.showCodeModal = false;
                this.expandedVisitorId = null;
                this.projectStats = createEmptyProjectStats();
                this.visitorsPage = createEmptyVisitorPage();
                this.visitorFilters = createDefaultVisitorFilters();
            } else if (path.startsWith('/dashboard/')) {
                // 处理项目详情路由
                const slug = path.substring('/dashboard/'.length);
                this.currentPage = 'project-detail';
                this.showCodeModal = false;
                this.expandedVisitorId = null;
                this.lastLoadedVisitorsRequestKey = '';
                this.visitorFilters = createDefaultVisitorFilters();
                // 如果项目已经加载过，则查找对应的项目
                if (this.projects.length > 0) {
                    const project = this.projects.find(p => p.slug === slug);
                    if (project) {
                        this.selectedProject = project;
                        this.loadStats(project.id);
                        this.loadVisitors(project.id, 1);
                    }
                }
            } else {
                this.currentPage = 'home';
                this.selectedProject = null;
                this.lastLoadedStatsProjectId = '';
                this.lastLoadedVisitorsRequestKey = '';
                this.showCodeModal = false;
                this.expandedVisitorId = null;
                this.projectStats = createEmptyProjectStats();
                this.visitorsPage = createEmptyVisitorPage();
                this.visitorFilters = createDefaultVisitorFilters();
            }
        },

        navigate(path) {
            window.history.pushState({}, '', path);
            this.parseRoute();
            window.scrollTo(0, 0);
            if (this.currentPage === 'dashboard' || this.currentPage === 'project-detail') {
                this.loadProjects();
            }
        },

        async checkAuth() {
            try {
                const res = await fetch('/api/v1/auth/me', { credentials: 'same-origin' });
                const data = await res.json();
                if (data.success) {
                    this.user = data.data;
                }
            } catch (e) {
                console.error('Auth check failed', e);
            }
        },

        async login() {
            this.loginLoading = true;
            this.loginError = null;

            try {
                const res = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.loginForm),
                    credentials: 'same-origin'
                });

                const data = await res.json();

                if (data.success) {
                    this.user = data.data.user;
                    this.loginForm = { email: '', password: '' };
                    this.navigate('/dashboard');
                } else {
                    this.loginError = data.error || (this.lang === 'zh' ? '登录失败' : 'Invalid credentials');
                }
            } catch (e) {
                this.loginError = this.lang === 'zh' ? '发生错误，请重试' : 'Something went wrong. Please try again.';
                console.error(e);
            } finally {
                this.loginLoading = false;
            }
        },

        async register() {
            this.registerLoading = true;
            this.registerError = null;
            this.registerSuccess = null;

            try {
                const res = await fetch('/api/v1/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.registerForm),
                    credentials: 'same-origin'
                });

                const data = await res.json();

                if (data.success) {
                    this.user = data.data.user;
                    this.registerForm = { name: '', email: '', password: '' };
                    this.registerSuccess = this.lang === 'zh' ? '账户创建成功！正在跳转...' : 'Account created! Redirecting...';
                    setTimeout(() => {
                        this.navigate('/dashboard');
                    }, 1000);
                } else {
                    this.registerError = data.error || (this.lang === 'zh' ? '发生错误' : 'Something went wrong');
                }
            } catch (e) {
                this.registerError = this.lang === 'zh' ? '发生错误，请重试' : 'Something went wrong. Please try again.';
                console.error(e);
            } finally {
                this.registerLoading = false;
            }
        },

        async logout() {
            try {
                await fetch('/api/v1/auth/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
                this.user = null;
                this.navigate('/');
            } catch (e) {
                console.error('Logout failed', e);
            }
        },

        async loadProjects() {
            this.loading = true;
            try {
                const res = await fetch('/api/v1/projects', { credentials: 'same-origin' });
                const data = await res.json();
                if (data.success) {
                    this.projects = data.data;
                    // 如果当前是项目详情页面，查找对应的项目
                    if (this.currentPage === 'project-detail') {
                        const path = window.location.pathname;
                        const slug = path.substring('/dashboard/'.length);
                        const project = this.projects.find(p => p.slug === slug);
                        if (project) {
                            this.selectedProject = project;
                            this.loadStats(project.id);
                            this.loadVisitors(project.id, 1);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load projects', e);
            } finally {
                this.loading = false;
            }
        },

        async createProject() {
            this.creating = true;
            try {
                const res = await fetch('/api/v1/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.newProject),
                    credentials: 'same-origin'
                });

                const data = await res.json();
                if (data.success) {
                    this.showCreateModal = false;
                    this.newProject = { name: '', slug: '', description: '' };
                    await this.loadProjects();
                } else {
                    this.showToast(data.error || this.t('errorCreate'), 'error');
                }
            } catch (e) {
                console.error(e);
                this.showToast(this.t('errorGeneric'), 'error');
            } finally {
                this.creating = false;
            }
        },

        async deleteProject(id) {
            if (!confirm(this.t('confirmDelete'))) return;

            try {
                const res = await fetch(`/api/v1/projects/${id}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });

                if (res.ok) {
                    await this.loadProjects();
                }
            } catch (e) {
                console.error(e);
            }
        },

        viewProjectStats(project) {
            this.navigate(`/dashboard/${project.slug}`);
        },

        resetCodeSettings() {
            this.codeSettings = {
                counterName: 'visits',
                counterLabel: this.lang === 'zh' ? '访问量' : 'Visits',
                counterColor: '',
                badgeName: 'downloads',
                badgeLabel: this.lang === 'zh' ? '下载量' : 'Downloads',
                badgeColor: '',
                badgeStyle: '',
                homepageUrl: '',
                pageId: ''
            };
        },

        openCodeModal(project) {
            this.selectedProject = project;
            this.resetCodeSettings();
            this.showCodeModal = true;
        },

        closeCodeModal() {
            this.showCodeModal = false;
            if (this.currentPage !== 'project-detail') {
                this.selectedProject = null;
            }
        },

        getQueryString(params) {
            const search = new URLSearchParams();
            Object.entries(params || {}).forEach(([key, value]) => {
                if (value !== null && value !== undefined && String(value).trim() !== '') {
                    search.set(key, String(value).trim());
                }
            });
            const result = search.toString();
            return result ? `?${result}` : '';
        },

        getCounterSvgPath(project = this.selectedProject) {
            if (!project) return '';
            const name = this.codeSettings.counterName || 'visits';
            const query = this.getQueryString({
                label: this.codeSettings.counterLabel,
                color: this.codeSettings.counterColor,
                homepage: this.getHomepageLink(),
                page_id: this.codeSettings.pageId
            });
            return `/svg/${project.slug}/counter/${name}.svg${query}`;
        },

        getBadgeSvgPath(project = this.selectedProject) {
            if (!project) return '';
            const name = this.codeSettings.badgeName || 'downloads';
            const query = this.getQueryString({
                label: this.codeSettings.badgeLabel,
                color: this.codeSettings.badgeColor,
                style: this.codeSettings.badgeStyle,
                homepage: this.getHomepageLink(),
                page_id: this.codeSettings.pageId
            });
            return `/svg/${project.slug}/badge/${name}.svg${query}`;
        },

        getCounterSvgUrl(project = this.selectedProject) {
            return this.getAbsoluteUrl(this.getCounterSvgPath(project));
        },

        getBadgeSvgUrl(project = this.selectedProject) {
            return this.getAbsoluteUrl(this.getBadgeSvgPath(project));
        },

        getCounterMarkdown(project = this.selectedProject) {
            const label = this.codeSettings.counterLabel || this.codeSettings.counterName || 'Visits';
            const url = this.getCounterSvgUrl(project);
            const homepage = this.getHomepageLink();
            if (!url) return '';
            return homepage ? `[![${label}](${url})](${homepage})` : `![${label}](${url})`;
        },

        getBadgeMarkdown(project = this.selectedProject) {
            const label = this.codeSettings.badgeLabel || this.codeSettings.badgeName || 'Downloads';
            const url = this.getBadgeSvgUrl(project);
            const homepage = this.getHomepageLink();
            if (!url) return '';
            return homepage ? `[![${label}](${url})](${homepage})` : `![${label}](${url})`;
        },

        getHomepageLink() {
            const value = String(this.codeSettings.homepageUrl || '').trim();
            if (!value) return '';
            try {
                const normalized = value.includes('://') ? value : `https://${value}`;
                const target = new URL(normalized);
                return `${target.protocol}//${target.host}/`;
            } catch (e) {
                return '';
            }
        },

        getPublicBaseUrl() {
            return window.location.origin;
        },

        getAbsoluteUrl(path) {
            return path ? `${this.getPublicBaseUrl()}${path}` : '';
        },

        getDemoCounterUrl() {
            const path = `/svg/demo/counter/visits.svg${this.getQueryString({
                label: this.lang === 'zh' ? '访问量' : 'Visits',
                color: '7c3aed'
            })}`;
            return this.getAbsoluteUrl(path);
        },

        getDemoBadgeUrl() {
            const path = `/svg/demo/badge/downloads.svg${this.getQueryString({
                label: this.lang === 'zh' ? '下载量' : 'Downloads',
                color: '0ea5e9',
                style: 'flat'
            })}`;
            return this.getAbsoluteUrl(path);
        },

        getDemoMarkdown() {
            const label = this.lang === 'zh' ? '访问量' : 'Visits';
            return `![${label}](${this.getDemoCounterUrl()})`;
        },

        getFreeBadgePath() {
            return `/svg/free/badge/visitor.svg${this.getQueryString({
                label: this.lang === 'zh' ? '访客' : 'visitors',
                page_id: this.freePageId
            })}`;
        },

        getFreeBadgeUrl() {
            return this.getAbsoluteUrl(this.getFreeBadgePath());
        },

        getFreeMarkdown() {
            return `![visitors](${this.getFreeBadgeUrl()})`;
        },

        getFreeHtml() {
            return `<img src="${this.getFreeBadgeUrl()}" alt="visitors">`;
        },

        showToast(message, type = 'success') {
            clearTimeout(this.toast.timer);
            this.toast.message = message;
            this.toast.type = type;
            this.toast.show = true;
            this.toast.timer = setTimeout(() => {
                this.toast.show = false;
            }, 2200);
        },

        copyText(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(this.t('copied'));
            });
        },

        getSortedEntries(record, limit = null) {
            const entries = Object.entries(record || {}).sort((a, b) => b[1] - a[1]);
            return limit ? entries.slice(0, limit) : entries;
        },

        getBarStyle(count, record) {
            const values = Object.values(record || {});
            const max = values.length ? Math.max(...values) : 0;
            const width = max > 0 ? (count / max) * 100 : 0;
            return `width: ${width}%`;
        },

        shortVisitorId(visitorId) {
            if (!visitorId) return '-';
            return visitorId.length > 12 ? `${visitorId.slice(0, 12)}...` : visitorId;
        },

        formatBadgePath(path) {
            if (!path) return '-';
            const match = path.match(/^\/svg\/[^/]+\/(counter|badge)\/(.+)\.svg$/);
            return match ? `${match[1]}/${match[2]}` : path;
        },

        formatDateTime(value) {
            if (!value) return '-';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return '-';
            return date.toLocaleString(this.lang === 'zh' ? 'zh-CN' : 'en-US');
        },

        formatVisitorLocation(visitor) {
            const parts = [visitor.country, visitor.region, visitor.city].filter(Boolean);
            return parts.length ? parts.join(' / ') : '-';
        },

        getVisitorPaginationText() {
            return this.t('visitorPagination')
                .replace('{page}', this.visitorsPage.page || 1)
                .replace('{totalPages}', this.visitorsPage.totalPages || 1);
        },

        getVisitorQueryString(page = 1) {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('page_size', String(this.visitorFilters.pageSize || 20));
            if (this.visitorFilters.device) params.set('device', this.visitorFilters.device);
            if (this.visitorFilters.browser) params.set('browser', this.visitorFilters.browser);
            if (this.visitorFilters.path) params.set('path', this.visitorFilters.path);
            if (this.visitorFilters.sort) params.set('sort', this.visitorFilters.sort);
            return params.toString();
        },

        applyVisitorFilters() {
            if (!this.selectedProject) return;
            this.lastLoadedVisitorsRequestKey = '';
            this.loadVisitors(this.selectedProject.id, 1);
        },

        resetVisitorFilters() {
            this.visitorFilters = createDefaultVisitorFilters();
            this.applyVisitorFilters();
        },

        toggleVisitorDetail(visitorId) {
            this.expandedVisitorId = this.expandedVisitorId === visitorId ? null : visitorId;
        },

        async loadVisitors(projectId, page = 1) {
            if (!projectId) return;

            const pageSize = this.visitorFilters.pageSize || 20;
            const requestKey = `${projectId}:${page}:${pageSize}`;
            const queryString = this.getVisitorQueryString(page);
            const fullRequestKey = `${projectId}:${queryString}`;
            if (this.lastLoadedVisitorsRequestKey === fullRequestKey) return;

            this.lastLoadedVisitorsRequestKey = fullRequestKey;
            this.loadingVisitors = true;
            this.expandedVisitorId = null;
            this.visitorsPage = {
                ...createEmptyVisitorPage(),
                page,
                pageSize
            };

            try {
                const res = await fetch(`/api/v1/projects/${projectId}/visitors?${queryString}`, { credentials: 'same-origin' });
                const data = await res.json();
                if (data.success) {
                    this.visitorsPage = {
                        ...createEmptyVisitorPage(),
                        ...data.data
                    };
                }
            } catch (e) {
                this.lastLoadedVisitorsRequestKey = '';
                console.error('Failed to load visitors', e);
            } finally {
                this.loadingVisitors = false;
            }
        },

        changeVisitorPage(nextPage) {
            if (!this.selectedProject) return;
            if (nextPage < 1) return;
            if (this.visitorsPage.totalPages > 0 && nextPage > this.visitorsPage.totalPages) return;
            this.loadVisitors(this.selectedProject.id, nextPage);
        },
        
        async loadStats(projectId) {
            if (!projectId) return;
            if (this.lastLoadedStatsProjectId === projectId) return;

            this.lastLoadedStatsProjectId = projectId;
            this.loadingStats = true;
            this.expandedVisitorId = null;
            this.projectStats = createEmptyProjectStats();
            try {
                const res = await fetch(`/api/v1/projects/${projectId}/stats`, { credentials: 'same-origin' });
                const data = await res.json();
                if (data.success) {
                    this.projectStats = {
                        ...createEmptyProjectStats(),
                        ...data.data
                    };
                }
            } catch (e) {
                this.lastLoadedStatsProjectId = '';
                console.error('Failed to load stats', e);
            } finally {
                this.loadingStats = false;
            }
        }
    };
}

// Load all components after DOM is ready
async function loadComponents() {
	// Function to load and insert a single component
	async function loadAndInsert(path, containerId) {
		try {
			const response = await fetch(path);
			const html = await response.text();
			const container = document.getElementById(containerId);
			if (container) {
				container.innerHTML = html;
			}
		} catch (e) {
			console.error('Failed to load component:', path, e);
		}
	}

	// Load navbar
	await loadAndInsert('/components/Navbar.html', 'navbar-container');

	// Load all pages
	const [home, login, register, dashboard, dashboardProject] = await Promise.all([
		fetch('/components/pages/Home.html').then(r => r.text()),
		fetch('/components/pages/Login.html').then(r => r.text()),
		fetch('/components/pages/Register.html').then(r => r.text()),
		fetch('/components/pages/Dashboard.html').then(r => r.text()),
		fetch('/components/pages/DashboardProject.html').then(r => r.text())
	]);
	const pageContainer = document.getElementById('page-container');
	if (pageContainer) {
		pageContainer.innerHTML = home + login + register + dashboard + dashboardProject;
	}

	// Load all modals
	const [createModal, detailModal] = await Promise.all([
		fetch('/components/CreateProjectModal.html').then(r => r.text()),
		fetch('/components/ProjectDetailModal.html').then(r => r.text())
	]);
	const modalsContainer = document.getElementById('modals-container');
	if (modalsContainer) {
		modalsContainer.innerHTML = createModal + detailModal;
	}
}

// Start loading components when DOM is ready
document.addEventListener('DOMContentLoaded', loadComponents);

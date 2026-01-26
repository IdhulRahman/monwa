const puppeteer = require('puppeteer');

/**
 * BrowserManager - Singleton Pattern
 * Manages a single Puppeteer browser instance for all WhatsApp clients
 * Memory efficient: One browser, multiple pages/contexts
 */
class BrowserManager {
    constructor() {
        if (BrowserManager.instance) {
            return BrowserManager.instance;
        }
        
        this.browser = null;
        this.isInitializing = false;
        this.initPromise = null;
        BrowserManager.instance = this;
    }
    
    /**
     * Get or create browser instance
     * Thread-safe initialization
     */
    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }
        
        if (this.isInitializing) {
            return this.initPromise;
        }
        
        this.isInitializing = true;
        this.initPromise = this._launchBrowser();
        
        try {
            this.browser = await this.initPromise;
            return this.browser;
        } finally {
            this.isInitializing = false;
            this.initPromise = null;
        }
    }
    
    async _launchBrowser() {
        console.log('[BrowserManager] Launching Puppeteer browser...');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            defaultViewport: null
        });
        
        console.log('[BrowserManager] Browser launched successfully');
        
        browser.on('disconnected', () => {
            console.log('[BrowserManager] Browser disconnected');
            this.browser = null;
        });
        
        return browser;
    }
    
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('[BrowserManager] Browser closed');
        }
    }
}

module.exports = new BrowserManager();

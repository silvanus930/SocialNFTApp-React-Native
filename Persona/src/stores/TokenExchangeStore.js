import {makeObservable, observable, computed, action, runInAction} from 'mobx';

class TokenExchangeStore {
    // find `cg_api_key` values for any new token at https://www.coingecko.com
    tokens = {
        usd: {name: 'US Dollar', cg_api_key: 'usd'},
        eth: {name: 'Ethereum', cg_api_key: 'ethereum'},
        usdc: {name: 'USD Coin', cg_api_key: 'usd-coin'},
    };
    cacheExpiryInSeconds = 300;
    refreshRateInSeconds = 120;

    constructor() {
        makeObservable(this, {
            tokens: observable,
            fetchExchangeRate: action,
            //
            fetchExchangeRateWithCurrencyAPI: action, // free, but not all that accurate
            fetchExchangeRateWithCoinGecko: action, // we'll need an API license
        });

        this.refreshTokens();
        setInterval(this.refreshTokens, this.refreshRateInSeconds * 1000);
    }

    refreshTokens = () => {
        this.fetchExchangeRate(Object.keys(this.tokens));
    };

    fetchExchangeRate = async (symbols, force = false) => {
        this.fetchExchangeRateWithCurrencyAPI(symbols, force);
    };

    fetchExchangeRateWithCurrencyAPI = async (symbols = [], force = false) => {
        const currentTime = Date.now() / 1000;

        if (typeof symbols === 'string') {
            symbols = [symbols];
        }

        if (!Array.isArray(symbols)) {
            throw new Error(
                `[TokenExchangeStore#fetchExchangeRate] fetchExchangeRate accepts an array of symbols (strings) or a single symbol (string). Got '${symbols}'`,
            );
        }

        const symbolsToFetch = symbols.filter(symbol => {
            return (
                force === true ||
                !this.tokens[symbol]?.rate ||
                (this.tokens[symbol] &&
                    this.tokens[symbol].rate &&
                    currentTime - this.tokens[symbol].timestamp >
                        this.cacheExpiryInSeconds)
            );
        });

        if (symbolsToFetch.length === 0) {
            return;
        }

        const updatedTokens = {...this.tokens};

        try {
            symbolsToFetch.map(async symbol => {
                const endpoint = `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${symbol.toLowerCase()}/usd.json`;

                const res = await fetch(endpoint, {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: 0,
                    },
                });

                const data = await res.json();
                const exchangeRate = data?.usd;

                if (exchangeRate) {
                    updatedTokens[symbol] = {
                        ...updatedTokens[symbol],
                        rate: exchangeRate,
                        timestamp: currentTime,
                    };
                }
                runInAction(() => {
                    this.tokens = updatedTokens;
                });
            });
        } catch (error) {
            console.error(
                `[TokenExchangeStore#fetchExchangeRate] Error fetching exchange rate for ${symbolsToFetch}: ${error}`,
            );
            throw error;
        }
    };

    //
    // We'll need an API license;  will rate limit otherwise
    //
    fetchExchangeRateWithCoinGecko = async (symbols, force = false) => {
        const currentTime = Date.now() / 1000;

        if (typeof symbols === 'string') {
            symbols = [symbols];
        }

        if (!Array.isArray(symbols)) {
            throw new Error(
                '[TokenExchangeStore#fetchExchangeRate] fetchExchangeRate accepts an array of symbols (strings) or a single symbol (string).',
            );
        }

        const symbolsToFetch = symbols.filter(symbol => {
            return (
                force === true ||
                !this.tokens[symbol]?.rate ||
                (this.tokens[symbol] &&
                    this.tokens[symbol].rate &&
                    currentTime - this.tokens[symbol].timestamp >
                        this.cacheExpiry)
            );
        });

        if (symbolsToFetch.length === 0) {
            return;
        }

        const updatedTokens = {...this.tokens};

        try {
            const endpoint = `https://api.coingecko.com/api/v3/simple/price?ids=${symbolsToFetch
                .map(symbol => this.tokens[symbol.toLowerCase()]?.cg_api_key)
                .join(',')}&vs_currencies=usd`;

            const response = await fetch(endpoint);
            const data = await response.json();

            symbolsToFetch.forEach(symbol => {
                const key = this.tokens[symbol].cg_api_key;
                const exchangeRate = data[key]?.usd;

                if (exchangeRate) {
                    updatedTokens[symbol] = {
                        ...updateTokens[symbol],
                        rate: exchangeRate,
                        timestamp: currentTime,
                    };
                }
            });

            runInAction(() => {
                this.tokens = updatedTokens;
            });
        } catch (error) {
            console.error(
                `[TokenExchangeStore#fetchExchangeRate] Error fetching exchange rate for ${symbolsToFetch}: ${error}`,
            );
            throw error;
        }
    };
}

const tokenExchangeStore = new TokenExchangeStore();

export default tokenExchangeStore;

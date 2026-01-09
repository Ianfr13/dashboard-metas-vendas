
import { describe, it, expect } from 'vitest';
import { generateTrackingUrl, UrlParams } from './urlGenerator';

describe('generateTrackingUrl', () => {
    it('should generate a URL with only base details', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com');
    });

    it('should clean trailing slashes from base URL', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com/',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com');
    });

    it('should append path parameters in correct order', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com',
            fid: 'funnel01',
            fver: 'v2',
            pver: 'b',
            oid: 'offer_99',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com/fid=funnel01/fver=v2/pver=b/oid=offer_99');
    });

    it('should append UTM parameters as query string', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com',
            utm_source: 'fb',
            utm_medium: 'cpc',
            utm_campaign: 'promo',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com?utm_source=fb&utm_medium=cpc&utm_campaign=promo');
    });

    it('should combine path parameters and UTMs correctly', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com/',
            fid: 'f1',
            utm_source: 'fb',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com/fid=f1?utm_source=fb');
    });

    it('should handle existing query params in base URL', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com?existing=1',
            fid: 'f1',
            utm_source: 'fb',
        };
        // This is tricky. If base URL has query params, appending path segments usually goes BEFORE query params.
        // However, simplistic string concatenation might break this.
        // The utility needs to handle this smartly: insert path segments before '?', and append new query params to existing ones.
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com/fid=f1?existing=1&utm_source=fb');
    });

    it('should ignore empty parameters', () => {
        const params: UrlParams = {
            baseUrl: 'https://mysite.com',
            fid: '', // empty
            utm_source: 'fb',
            utm_medium: '' // empty
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://mysite.com?utm_source=fb');
    });

    it('should include fstg parameter', () => {
        const params: UrlParams = {
            baseUrl: 'https://domain.com',
            fstg: 'upsell-1',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://domain.com/fstg=upsell-1');
    });

    it('should clean up trailing slashes with fstg', () => {
        const params: UrlParams = {
            baseUrl: 'https://domain.com/',
            fstg: 'downsell',
        };
        const result = generateTrackingUrl(params);
        expect(result).toBe('https://domain.com/fstg=downsell');
    });
});

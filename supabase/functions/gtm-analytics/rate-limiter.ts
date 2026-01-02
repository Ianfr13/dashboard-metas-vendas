export class RateLimiter {
    private requests: Map<string, number[]> = new Map()
    private windowMs: number
    private maxRequests: number

    constructor(windowMs: number = 60000, maxRequests: number = 100) {
        this.windowMs = windowMs
        this.maxRequests = maxRequests
    }

    check(ip: string): boolean {
        const now = Date.now()
        const timestamps = this.requests.get(ip) || []

        // Remover timestamps antigos
        const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs)

        if (validTimestamps.length >= this.maxRequests) {
            return false
        }

        validTimestamps.push(now)
        this.requests.set(ip, validTimestamps)

        // Limpeza periódica (opcional)
        if (this.requests.size > 10000) {
            this.requests.clear() // Prevent memory leak
        }

        return true
    }
}

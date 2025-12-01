

export class CurveGenerator {
    /**
     * 
     * @param {Array} points
     * @param {number} t 
     * @returns {Object} 
     */
    static deCasteljau(points, t) {
        if (points.length === 1) return points[0];
        
        const newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            newPoints.push({
                x: (1 - t) * points[i].x + t * points[i + 1].x,
                y: (1 - t) * points[i].y + t * points[i + 1].y
            });
        }
        return this.deCasteljau(newPoints, t);
    }

    /**
     * 
     * @param {Array} controlPoints 
     * @param {number} subdivisions 
     * @returns {Array} 
     */
    static generateBezier(controlPoints, subdivisions = 50) {
        const curve = [];
        for (let i = 0; i <= subdivisions; i++) {
            const t = i / subdivisions;
            curve.push(this.deCasteljau(controlPoints, t));
        }
        return curve;
    }

    /**
     *
     * @param {number} i 
     * @param {number} k 
     * @param {number} t 
     * @param {Array} knots 
     * @returns {number} 
     */
    static bSplineBasis(i, k, t, knots) {
        if (k === 0) {
            return (knots[i] <= t && t < knots[i + 1]) ? 1 : 0;
        }
        
        const denomLeft = knots[i + k] - knots[i];
        const denomRight = knots[i + k + 1] - knots[i + 1];
        
        let left = 0;
        if (denomLeft !== 0) {
            left = ((t - knots[i]) / denomLeft) * this.bSplineBasis(i, k - 1, t, knots);
        }
        
        let right = 0;
        if (denomRight !== 0) {
            right = ((knots[i + k + 1] - t) / denomRight) * this.bSplineBasis(i + 1, k - 1, t, knots);
        }
        
        return left + right;
    }

    /**
     * 
     * @param {Array} controlPoints 
     * @param {number} degree 
     * @param {number} subdivisions 
     * @returns {Array} 
     */
    static generateBSpline(controlPoints, degree = 3, subdivisions = 50) {
        const n = controlPoints.length - 1;
        const k = degree;
        const m = n + k + 1;
        
       
        const knots = [];
        for (let i = 0; i <= m; i++) {
            if (i <= k) knots.push(0);
            else if (i >= m - k) knots.push(m - 2 * k);
            else knots.push(i - k);
        }
        
        const curve = [];
        const tMax = knots[m - k];
        
        for (let i = 0; i <= subdivisions; i++) {
            const t = (i / subdivisions) * tMax;
            let x = 0, y = 0;
            
            for (let j = 0; j <= n; j++) {
                const basis = this.bSplineBasis(j, k, t, knots);
                x += controlPoints[j].x * basis;
                y += controlPoints[j].y * basis;
            }
            
            curve.push({ x, y });
        }
        
        return curve;
    }
}
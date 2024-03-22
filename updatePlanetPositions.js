import {solarSystemProperties} from './solarsystem'
import { universeProperties } from './universe';


export function updatePlanetPositions(deltaTime, planets) {

    planets.forEach((p, i) => {

        // Standard Gravitational parameter 
        // We only need the mass of the central body
        // The mass of the satellite is negligable in comparison to the mass of the central body
        const mu = universeProperties.G * solarSystemProperties.sunMass // mass of the central body (eg satellite orbiting a moon)

        // Calculate the mean motion (n) - the rate at which the mean anomaly increases
        planets[i].n = Math.sqrt(mu / Math.pow(p.a, 3));

        // update mean anomaly
        p.M += p.n * deltaTime; 

        // Simplified conversion from mean anomaly to true anomaly (ν)
        // This is a very rough approximation for small eccentricities
        let E = p.M + p.e * Math.sin(p.M); // Eccentric anomaly, approximate
        let nu = 2 * Math.atan2(Math.sqrt(1 + p.e) * Math.sin(E / 2), Math.sqrt(1 - p.e) * Math.cos(E / 2)); // True anomaly, approximate

        // Calculate position in the orbit plane
        let r = p.a * (1 - p.e * Math.cos(E)); // Distance from the central body
        let x = r * Math.cos(nu);
        let y = r * Math.sin(nu);

        // convert inclination degrees to radians, 
        // subtracting 90 so that inclination of 0 degrees is an orbit around the equator
        const _i = (p.i - 90) * Math.PI / 180

        // Convert to 3D coordinates
        p.X = x * (Math.cos(p.omega) * Math.cos(p.omega) - Math.sin(p.omega) * Math.sin(p.w) * Math.cos(_i)) + 
                y * (-Math.cos(p.omega) * Math.sin(p.w) - Math.sin(p.omega) * Math.cos(p.w) * Math.cos(_i));

        p.Y = x * (Math.sin(p.omega) * Math.cos(p.w) + Math.cos(p.omega) * Math.sin(p.w) * Math.cos(_i)) + 
                y * (-Math.sin(p.omega) * Math.sin(p.w) + Math.cos(p.omega) * Math.cos(p.w) * Math.cos(_i));

        p.Z = x * (Math.sin(p.w) * Math.sin(_i)) + y * (Math.cos(p.w) * Math.sin(_i));
    })



}
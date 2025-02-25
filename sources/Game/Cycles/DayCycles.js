import * as THREE from 'three/webgpu'
import { Cycles } from './Cycles.js'

export class DayCycles extends Cycles
{
    constructor()
    {
        super('🕜 Day Cycles', 4 * 60, null, false)
    }

    getKeyframesDescriptions()
    {
        const presets = {
            day:   { electricField: 0, temperature: 5, lightColor: new THREE.Color('#ffffff'), lightIntensity: 1.2, shadowColor: new THREE.Color('#3f5cff'), fogColorA: new THREE.Color('#00ffff'), fogColorB: new THREE.Color('#ffdf89'), fogNearRatio: 0.315, fogFarRatio: 1.25 },
            dusk:  { electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ff4141'), lightIntensity: 1.2, shadowColor: new THREE.Color('#4e009c'), fogColorA: new THREE.Color('#3e53ff'), fogColorB: new THREE.Color('#ff4ce4'), fogNearRatio: 0, fogFarRatio: 1.25 },
            night: { electricField: 1, temperature: -7.5, lightColor: new THREE.Color('#3240ff'), lightIntensity: 3.8, shadowColor: new THREE.Color('#2f00db'), fogColorA: new THREE.Color('#041242'), fogColorB: new THREE.Color('#490a42'), fogNearRatio: -0.225, fogFarRatio: 0.75 },
            dawn:  { electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ff9000'), lightIntensity: 1.2, shadowColor: new THREE.Color('#db004f'), fogColorA: new THREE.Color('#f885ff'), fogColorB: new THREE.Color('#ff7d24'), fogNearRatio: 0, fogFarRatio: 1.25 },
        }

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addBinding(this, 'duration', { min: 1, max: 60 * 10, step: 1 })

            for(const presetKey in presets)
            {
                const preset = presets[presetKey]
                const presetsDebugPanel = this.debugPanel.addFolder({
                    title: presetKey,
                    expanded: true,
                })

                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.lightColor, 'lightColor')
                presetsDebugPanel.addBinding(preset, 'lightIntensity', { min: 0, max: 20 })
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.shadowColor, 'shadowColor')
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.fogColorA, 'fogColorA')
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.fogColorB, 'fogColorB')
                presetsDebugPanel.addBinding(preset, 'fogNearRatio', { label: 'near', min: -2, max: 2, step: 0.001 })
                presetsDebugPanel.addBinding(preset, 'fogFarRatio', { label: 'far', min: -2, max: 2, step: 0.001 })
            }
        }

        return [
            [
                { properties: presets.day, stop: 0.0 }, // day
                { properties: presets.day, stop: 0.15 }, // day
                { properties: presets.dusk, stop: 0.25 }, // Dusk
                { properties: presets.night, stop: 0.35 }, // Night
                { properties: presets.night, stop: 0.6 }, // Night
                { properties: presets.dawn, stop: 0.8 }, // Dawn
                { properties: presets.day, stop: 0.9 }, // day
            ]
        ]
    }
}
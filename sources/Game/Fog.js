import * as THREE from 'three'
import { color, positionWorld, uniform, vec2 } from 'three/tsl'
import { Game } from './Game.js'

export class Fog
{
    constructor()
    {
        this.game = Game.getInstance()
        
        this.color = uniform(color('#b4fbff'))
        this.game.scene.backgroundNode = this.color

        this.fogNear = uniform(6)
        this.fogFar = uniform(45)
        this.fogOffset = uniform(vec2(0, 0))
        this.fogColor = this.color
        this.fogStrength = positionWorld.xz.sub(this.fogOffset).length().smoothstep(this.fogNear, this.fogFar)

        this.game.time.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    update()
    {
        this.fogOffset.value.set(this.game.view.focusPoint.position.x, this.game.view.focusPoint.position.z)

        // Apply day cycles values
        this.fogColor.value.copy(this.game.cycles.day.values.properties.fogColor.value)
        this.fogNear.value = this.game.cycles.day.values.properties.fogNear.value
        this.fogFar.value = this.game.cycles.day.values.properties.fogFar.value
    }
}
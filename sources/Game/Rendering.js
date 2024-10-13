import * as THREE from 'three/webgpu'
import { Game } from './Game.js'

export class Rendering
{
    constructor()
    {
        this.game = new Game()

        this.renderer = new THREE.WebGPURenderer()
        this.renderer.setSize(this.game.viewport.width, this.game.viewport.height)
        this.renderer.domElement.classList.add('experience')
        this.game.domElement.append(this.renderer.domElement)

        this.game.time.events.on('tick', () =>
        {
            this.render()
        }, 999)

        this.game.viewport.events.on('change', () =>
        {
            this.resize()
        })
    }

    resize()
    {
        this.renderer.setSize(this.game.viewport.width, this.game.viewport.height)
    }

    render()
    {
        this.renderer.renderAsync(this.game.world.scene, this.game.view.camera)
    }
}
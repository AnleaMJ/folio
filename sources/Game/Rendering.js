import * as THREE from 'three'
import { Game } from './Game.js'

export class Rendering
{
    constructor()
    {
        this.game = new Game()

        this.renderer = new THREE.WebGPURenderer({ forceWebGL: false })
        this.renderer.setSize(this.game.viewport.width, this.game.viewport.height)
        this.renderer.domElement.classList.add('experience')
        this.renderer.setClearColor(0x1b191f)
        this.game.domElement.append(this.renderer.domElement)

        this.game.time.events.on('tick', () =>
        {
            this.render()
        }, 5)

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
        this.renderer.renderAsync(this.game.scene, this.game.view.camera)
    }
}
import * as THREE from 'three'
import { Game } from './Game.js'

export class WheelTracks
{
    constructor()
    {
        this.game = new Game()
        this.resolution = 1024
        this.size = 20
        this.tracks = []
        
        this.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 10)
        this.camera.position.y = 5
        this.camera.rotation.x = - Math.PI * 0.5
        
        this.scene = new THREE.Scene()
        this.scene.add(this.camera)

        this.renderTarget = new THREE.RenderTarget(
            this.resolution,
            this.resolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping
            }
        )

        // this.dummy = new THREE.Mesh(
        //     new THREE.BoxGeometry(5, 5, 1),
        //     new THREE.MeshBasicMaterial({ wireframe: true, color: 'red' })
        // )
        // this.scene.add(this.dummy)

        // this.debugPlane = new THREE.Mesh(
        //     new THREE.PlaneGeometry(5, 5),
        //     new THREE.MeshBasicMaterial({ map: this.renderTarget.texture, transparent: true })
        // )
        // this.debugPlane.position.y = 5
        // this.game.scene.add(this.debugPlane)
    }

    addTrack(track)
    {
        this.tracks.push(track)
        this.scene.add(track.trail.mesh)
        return track
    }

    update()
    {
        const clearAlpha = this.game.rendering.renderer.getClearAlpha()
        
        this.game.rendering.renderer.setClearAlpha(0)
        this.game.rendering.renderer.setRenderTarget(this.renderTarget)

        this.game.rendering.renderer.renderAsync(this.scene, this.camera)

        this.game.rendering.renderer.setRenderTarget(null)
        this.game.rendering.renderer.setClearAlpha(clearAlpha)
    }
}
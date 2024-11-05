import * as THREE from 'three'
import { Game } from './Game.js'
import { cos, sin, sign, atan2, varying, float, uv, texture, Fn, vec2, vec3, vec4, positionGeometry } from 'three'

export class WheelTrack
{
    constructor()
    {
        this.game = new Game()

        this.size = 128
        this.timeSpan = 1 / 30
        this.lastTime = 0
        
        this.setTexture()
        this.setTrail()
        // this.setDebugPlane()
    }

    setTexture()
    {
        this.texture = new THREE.DataTexture(
            new Float32Array(this.size * 4),
            this.size,
            1,
            THREE.RGBAFormat,
            THREE.FloatType
        )
        
        // this.texture.canvas = document.createElement('canvas')
        // this.texture.canvas.width = this.size
        // this.texture.canvas.height = 1
        // this.texture.canvas.style.position = 'fixed'
        // this.texture.canvas.style.top = 0
        // this.texture.canvas.style.left = 0
        // this.texture.canvas.style.zIndex = 1
        // this.texture.canvas.style.width = `${this.size * 4}px`
        // this.texture.canvas.style.height = '32px'

        // document.body.append(this.texture.canvas)
        
        // this.texture.context = this.texture.canvas.getContext('2d')
        // this.texture.instance = new THREE.CanvasTexture(this.texture.canvas)
    }

    setTrail()
    {
        this.trail = {}
        this.trail.geometry = new THREE.PlaneGeometry(1, 1, this.size, 1)
        this.trail.geometry.translate(0.5, 0, 0)
        // this.trail.geometry.rotateX(Math.PI * 0.5)
        
        this.trail.material = new THREE.MeshBasicNodeMaterial({ wireframe: false, depthTest: false, transparent: true })

        const trackData = varying(vec4())
        
        this.trail.material.positionNode = Fn(() =>
        {
            const fragmentSize = float(1).div(this.size)

            const ratio = uv().x.sub(fragmentSize.mul(0.5))

            const trackUV = vec2(
                ratio,
                0.5
            )
            const trackUVPrev = vec2(
                ratio.sub(fragmentSize),
                0.5
            )
            trackData.assign(texture(this.texture, trackUV))
            const trackDataPrev = texture(this.texture, trackUVPrev)

            const angle = atan2(
                trackData.z.sub(trackDataPrev.z),
                trackData.x.sub(trackDataPrev.x),
            )

            const sideSign = sign(positionGeometry.y).mul(-1)
            const testPosition = vec2(
                cos(angle.add(sideSign.mul(Math.PI * 0.5))),
                sin(angle.add(sideSign.mul(Math.PI * 0.5)))
            ).mul(0.3)
            
            const newPosition = vec3(
                trackData.x.add(testPosition.x),
                trackData.y,
                trackData.z.add(testPosition.y)
            )

            return newPosition
        })()
        
        this.trail.material.outputNode = Fn(() =>
        {
            const alpha = uv().x.smoothstep(0.5, 1).oneMinus().mul(trackData.a)
            // trackData.a
            return vec4(uv(), 1, alpha)
        })()
        
        this.trail.mesh = new THREE.Mesh(this.trail.geometry, this.trail.material)
        this.game.scene.add(this.trail.mesh)
    }

    setDebugPlane()
    {
        this.debugPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 1),
            new THREE.MeshBasicMaterial({ map: this.texture })
        )
        this.debugPlane.position.y = 2
        this.game.scene.add(this.debugPlane)
    }

    update(_position, _touching)
    {
        const data = this.texture.source.data.data

        const lastTimeDelta = this.game.time.elapsed - this.lastTime

        if(lastTimeDelta > this.timeSpan)
        {
            // Move data one "pixel"
            for(let i = this.size - 1; i >= 0; i--)
            {
                const i4 = i * 4
                data[i4    ] = data[i4 - 4]
                data[i4 + 1] = data[i4 - 3]
                data[i4 + 2] = data[i4 - 2]
                data[i4 + 3] = data[i4 - 1]
            }

            // Draw new position
            data[0] = _position.x
            data[1] = _position.y
            data[2] = _position.z
            data[3] = _touching ? 1 : 0

            // Save time
            this.lastTime = this.game.time.elapsed
        }

        this.texture.needsUpdate = true
    }
}
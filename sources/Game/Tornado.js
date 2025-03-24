import * as THREE from 'three/webgpu'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { Line2 } from 'three/addons/lines/webgpu/Line2.js';
import { Game } from './Game.js'
import gsap from 'gsap'

export class Tornado
{
    constructor()
    {
        this.game = Game.getInstance()

        this.strength = 0
        this.resolution = 20
        this.position = new THREE.Vector3()

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🌪️ Tornado',
                expanded: true
            })
        }

        this.setPath()
        // this.setPreviews()

        // Update
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })

        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addButton({ title: 'start' }).on('click', () => { this.start() })
            this.debugPanel.addButton({ title: 'stop' }).on('click', () => { this.stop() })
        }
    }

    setPath()
    {
        const points = []

        const referenceArray = this.game.resources.tornadoPathModel.scene.children[0].geometry.attributes.position.array
        const count = referenceArray.length / 3

        for(let i = 0; i < count; i++)
        {
            const i3 = i * 3
            const point = new THREE.Vector3(
                referenceArray[i3 + 0], 
                0, 
                referenceArray[i3 + 2]
            )

            points.push(point)
        }
        const curve = new THREE.CatmullRomCurve3(points, true)
        this.path = curve.getSpacedPoints(this.resolution)
    }

    setPreviews()
    {
        this.previews = {}

        const boxGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
        this.previews.target = new THREE.Mesh(boxGeometry, new THREE.MeshBasicNodeMaterial({ color: '#00ff00' }))
        this.previews.target.scale.y = 10
        this.game.scene.add(this.previews.target)

        this.previews.eased = new THREE.Mesh(boxGeometry, new THREE.MeshBasicNodeMaterial({ color: '#00ffff' }))
        this.previews.eased.scale.y = 10
        this.game.scene.add(this.previews.eased)

        const positions = []
        for(const point of this.path)
        {
            positions.push(point.x, point.y, point.z)
        }
        const lineGeometry = new LineGeometry()
        lineGeometry.setPositions(positions)
        
        const lineMaterial = new THREE.Line2NodeMaterial({
		    color: '#00ff00',
            linewidth: 5, // in world units with size attenuation, pixels otherwise
            // vertexColors: true,
            dashed: true,
            dashSize: 0.2,
            gapSize: 0.4,
            alphaToCoverage: true,
        })
        
        this.previews.line = new Line2(lineGeometry, lineMaterial)
        this.previews.line.computeLineDistances()
        this.previews.line.scale.set( 1, 1, 1 );
        this.previews.line.position.y += 0.5
        this.game.scene.add(this.previews.line)
    }

    start()
    {
        const progress = this.game.dayCycles.absoluteProgress * 2
        this.position.copy(this.getPosition(progress))
        gsap.to(this, { strength: 1, duration: 20, ease: 'linear', overwrite: true })
    }

    stop()
    {
        gsap.to(this, { strength: 0, duration: 20, ease: 'linear', overwrite: true })
    }

    getPosition(progress)
    {
        const loopProgress = progress % 1
        const prevIndex = Math.floor(loopProgress * this.resolution)
        const nextIndex = (prevIndex + 1) % this.resolution
        const mix = loopProgress * this.resolution - prevIndex
        const prevPosition = this.path[prevIndex]
        const nextPosition = this.path[nextIndex]
        const position = new THREE.Vector3().lerpVectors(prevPosition, nextPosition, mix)

        return position
    }

    update()
    {
        if(this.strength === 0)
            return

        // Position on path
        const progress = this.game.dayCycles.absoluteProgress * 2
        const newPosition = this.getPosition(progress)
        
        this.position.lerp(newPosition, 0.1 * this.game.ticker.deltaScaled)

        // Previews
        if(this.previews)
        {
            this.previews.target.position.copy(newPosition)
            this.previews.eased.position.copy(this.position)
        }
    }
}

import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { color, dot, Fn, max, mix, normalGeometry, smoothstep, uniform, vec3, vec4 } from 'three/tsl'
import { normalWorld } from 'three/tsl'
import { Flowers } from './Flowers.js'
import { Bricks } from './Bricks.js'
import { Trees } from './Trees.js'
import { Bushes } from './Bushes.js'
import { PoleLights } from './PoleLights.js'
import { Playground } from './Playground.js'
import { Christmas } from './Christmas.js'
import { Altar } from './Altar.js'

export class Scenery
{
    constructor()
    {
        this.game = Game.getInstance()

        if(this.game.debug.active)
        {
            this.debugPanel = this.game.debug.panel.addFolder({
                title: '🛋️ Scenery',
                expanded: false,
            })
        }

        this.setStaticObjects()
        this.setDynamicsObjects()

        this.bushes = new Bushes()
        this.birchTrees = new Trees('Birch Tree', this.game.resources.birchTreesVisualModel.scene, this.game.resources.birchTreesReferencesModel.scene.children, '#ff782b')
        this.oakTrees = new Trees('Oak Tree', this.game.resources.oakTreesVisualModel.scene, this.game.resources.oakTreesReferencesModel.scene.children, '#c4c557')
        this.cherryTrees = new Trees('Cherry Tree', this.game.resources.cherryTreesVisualModel.scene, this.game.resources.cherryTreesReferencesModel.scene.children, '#ff6da8')
        this.flowers = new Flowers()
        this.bricks = new Bricks()
        this.poleLights = new PoleLights()

        if(this.references.altar)
            this.altar = new Altar(this.references.altar.position, this.references.altarCounter)
        // this.playground = new Playground()
        // this.christmas = new Christmas()

    }

    setStaticObjects()
    {
        // Models
        const visualModel = this.game.resources.sceneryStaticVisualModel.scene
        const physicalModel = this.game.resources.sceneryStaticPhysicalModel.scene

        // Items
        this.references = {}
        
        // Materials
        this.game.materials.updateObject(visualModel)

        // Shadows
        visualModel.traverse(_child =>
        {
            if(_child.isMesh)
            {
                _child.castShadow = true
                _child.receiveShadow = true
            }

            if(_child.name === 'altar')
                this.references.altar = _child
            else if(_child.name === 'altarCounter')
                this.references.altarCounter = _child
        })

        // Entities
        this.game.entities.addFromModels(
            physicalModel,
            visualModel,
            {
                type: 'fixed',
                friction: 0,
            }
        )
    }

    setDynamicsObjects()
    {
        for(const child of this.game.resources.sceneryDynamicModel.scene.children)
        {
            const visual = child.children.find(_child => _child.name.startsWith('visual') )
            const physical = child.children.find(_child => _child.name.startsWith('physical') )

            if(!visual || !physical)
            {
                console.warn(`missing visual or physical for dynamic object ${child.name}`)
            }
            else
            {
                // Materials
                this.game.materials.updateObject(visual)

                // Shadows
                visual.traverse(_child =>
                {
                    if(_child.isMesh)
                    {
                        _child.castShadow = true
                        _child.receiveShadow = true
                    }
                })

                // Entities
                this.game.entities.addFromModels(
                    physical,
                    visual,
                    {
                        type: 'dynamic',
                        friction: child.userData.friction ?? 0.5,
                        restitution: child.userData.restitution ?? 0.1,
                        position: child.position,
                        rotation: child.quaternion,
                        collidersOverload:
                        {
                            mass: (child.userData.mass ?? 1) / physical.children.length
                        }
                    }
                )
            }
        }
    }
}
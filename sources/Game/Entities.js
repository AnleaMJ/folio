import { Game } from './Game.js'

export class Entities
{
    constructor()
    {
        this.game = Game.getInstance()
        this.list = new Map()
        this.key = 0

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 3)
    }

    add(_visualDescription = null, _physicalDescription = null)
    {
        const entity = { visual: null, physical: null }

        /**
         * Visual
         */
        if(_visualDescription && _visualDescription.model)
        {
            entity.visual = _visualDescription.model

            // Default parameters
            const visualDescription = {
                updateMaterials: true,
                castShadow: true,
                receiveShadow: true,
                parent: this.game.scene,
                ..._visualDescription
            }
            
            // Update materials
            if(visualDescription.updateMaterials)
                this.game.materials.updateObject(visualDescription.model)

            // Update shadows
            if(visualDescription.castShadow || visualDescription.receiveShadow)
            {
                visualDescription.model.traverse(_child =>
                {
                    if(_child.isMesh)
                    {
                        if(visualDescription.castShadow)
                            _child.castShadow = true

                        if(visualDescription.receiveShadow)
                            _child.receiveShadow = true
                    }
                })
            }

            // Add to scene
            if(visualDescription.parent !== null)
                visualDescription.parent.add(entity.visual)
        }

        /**
         * Physical
         */
        if(_physicalDescription)
        {
            entity.physical = this.game.physics.getPhysical(_physicalDescription)
        }

        /**
         * Save
         */
        this.key++
        this.list.set(this.key, entity)

        // If sleeping, not enabled or fixed apply transform directly
        if(entity.visual && entity.physical)
        {
            if(_physicalDescription.sleeping || !_physicalDescription.enabled || _physicalDescription.type === 'fixed')
            {
                entity.visual.position.copy(entity.physical.body.translation())
                entity.visual.quaternion.copy(entity.physical.body.rotation())
            }
        }

        return entity
    }

    addFromModel(_model, _visualDescription = null, _physicalDescription = null)
    {
        // Extract physical from direct children and remove from scene
        const physical = _model.children.find(_child => _child.name.startsWith('physical') )
        if(physical)
            physical.removeFromParent()
    
        // Create collider from physical children names and scales
        const colliders = []

        if(physical)
        {
            for(const _physical of physical.children)
            {
                let collidersOverwrite = {}
                if(typeof _physicalDescription.collidersOverwrite !== 'undefined')
                    collidersOverwrite = _physicalDescription.collidersOverwrite

                const collider = {
                    position: _physical.position,
                    quaternion: _physical.quaternion,
                    ...collidersOverwrite
                }
                if(_physical.name.match(/^trimesh/i))
                {
                    collider.shape = 'trimesh'
                    collider.parameters = [ _physical.geometry.attributes.position.array, _physical.geometry.index.array ]
                }
                else if(_physical.name.match(/^hull/i))
                {
                    collider.shape = 'hull'
                    collider.parameters = [ _physical.geometry.attributes.position.array, _physical.geometry.index.array ]
                }
                else if(_physical.name.match(/^cub/i))
                {
                    collider.shape = 'cuboid'
                    collider.parameters = [ _physical.scale.x * 0.5, _physical.scale.y * 0.5, _physical.scale.z * 0.5 ]
                }

                colliders.push(collider)
            }
        }

        // Add
        return this.add(
            {
                ..._visualDescription,
                model: _model
            },
            {
                ..._physicalDescription,
                colliders: colliders
            }
        )
    }

    update()
    {
        this.list.forEach((_entity) =>
        {
            if(_entity.visual && _entity.physical)
            {
                if(!_entity.physical.body.isSleeping())
                {
                    _entity.visual.position.copy(_entity.physical.body.translation())
                    _entity.visual.quaternion.copy(_entity.physical.body.rotation())
                }
            }
        })
    }
}
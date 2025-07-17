import normalizeWheel from 'normalize-wheel'
import * as THREE from 'three/webgpu'

import { Events } from '../Events.js'
import { Game } from '../Game.js'
import { Gamepad } from './Gamepad.js'
import { Pointer } from './Pointer.js'
import Keyboard from './Keyboard.js'

export class Inputs
{
    constructor(actions = [], filters = [])
    {
        this.game = Game.getInstance()
        this.events = new Events()

        this.actions = new Map()
        this.filters = new Set()

        this.setKeyboard()
        this.setGamepad()
        this.setPointer()
        this.setWheel()

        this.addActions(actions)
        
        for(const filter of filters)
            this.filters.add(filter)

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 0)
    }

    setKeyboard()
    {
        this.keyboard = new Keyboard()

        this.keyboard.events.on('down', (key) =>
        {
            this.down(`Keyboard.${key}`)
        })

        this.keyboard.events.on('up', (key) =>
        {
            this.up(`Keyboard.${key}`)
        })
    }

    setGamepad()
    {
        this.gamepad = new Gamepad()

        this.gamepad.events.on('down', (key) =>
        {
            this.down(`Gamepad.${key.name}`, key.value)
        })

        this.gamepad.events.on('up', (key) =>
        {
            this.up(`Gamepad.${key.name}`)
        })

        this.gamepad.events.on('change', (key) =>
        {
            this.change(`Gamepad.${key.name}`, key.value)
        })
    }

    setPointer()
    {
        this.pointer = new Pointer(this.game.domElement)
    }

    setWheel()
    {
        addEventListener('wheel', (_event) =>
        {
            const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf('wheel') !== - 1 )
            
            for(const action of filteredActions)
            {
                if(this.checkCategory(action))
                {
                    const normalized = normalizeWheel(_event)
                    action.value = normalized.spinY
                    this.events.trigger(action.name, [ action ])
                }
            }
        }, { passive: true })
    }

    addActions(actions)
    {
        for(const action of actions)
        {
            const formatedAction = {...action}
            formatedAction.active = false
            formatedAction.value = 0
            formatedAction.activeKeys = new Set()

            this.actions.set(action.name, formatedAction)
        }
    }

    checkCategory(action)
    {
        // No filter => Allow all
        if(this.filters.size === 0)
            return true

        // Has filter but no category on action => Forbid
        if(action.categories.length === 0)
            return true

        // Has matching category and filter => All
        for(const category of action.categories)
        {
            if(this.filters.has(category))
                return true
        }

        // Otherwise => Forbid
        return false
    }

    down(key, value = 1)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && this.checkCategory(action))
            {
                action.value = value
                action.activeKeys.add(key)

                if(!action.active)
                {
                    action.active = true
                    
                    this.events.trigger('actionStart', [ action ])
                    this.events.trigger(action.name, [ action ])
                }
            }
        }
    }

    up(key)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && action.active)
            {
                action.activeKeys.delete(key)

                if(action.activeKeys.size === 0)
                {
                    action.active = false
                    action.value = 0
                    this.events.trigger('actionEnd', [ action ])
                    this.events.trigger(action.name, [ action ])
                }
            }
        }
    }

    change(key, value = 1)
    {
        const filteredActions = [...this.actions.values()].filter((_action) => _action.keys.indexOf(key) !== - 1 )
            
        for(const action of filteredActions)
        {
            if(action && action.active && this.checkCategory(action) && action.value !== value)
            {
                action.value = value
            }
        }
    }

    update()
    {
        this.pointer.update()
        this.gamepad.update()
    }
}
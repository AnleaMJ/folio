import normalizeWheel from 'normalize-wheel'
import * as THREE from 'three/webgpu'

import { Events } from '../Events.js'
import { Game } from '../Game.js'
import { Gamepad } from './Gamepad.js'
import { Pointer } from './Pointer.js'
import Keyboard from './Keyboard.js'

export class Inputs
{
    constructor(_map = [], filters = [])
    {
        this.game = Game.getInstance()
        this.events = new Events()

        this.keys = {}
        this.map = []
        this.filters = []

        this.setKeyboard()
        this.setGamepad()
        this.setPointer()
        this.setWheel()

        this.addMap(_map)
        this.setFilters(filters)

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
            const maps = this.map.filter((_map) => _map.keys.indexOf('wheel') !== - 1 )
            
            for(const map of maps)
            {
                if(this.checkCategory(map))
                {
                    const normalized = normalizeWheel(_event)
                    this.events.trigger(map.name, [ normalized.spinY ])
                }
            }
        }, { passive: true })
    }

    addMap(_map)
    {
        this.map.push(..._map)
    }

    checkCategory(map)
    {
        // No filter => Allow all
        if(this.filters.length === 0)
            return true

        // Has filter but no category on map => Forbid
        if(map.categories.length === 0)
            return true

        // Has matching category and filter => All
        for(const category of map.categories)
        {
            if(this.filters.indexOf(category) !== -1)
                return true
        }

        // Otherwise => Forbid
        return false
    }

    down(key, value = 1)
    {
        const maps = this.map.filter((_map) => _map.keys.indexOf(key) !== - 1 )
        
        for(const map of maps)
        {
            if(map && !this.keys[map.name] && this.checkCategory(map))
            {
                this.keys[map.name] = value
                this.events.trigger('keyDown', [ { down: true, name: map.name } ])
                this.events.trigger(map.name, [ { down: true, name: map.name } ])
            }
        }
    }

    up(key)
    {
        const maps = this.map.filter((_map) => _map.keys.indexOf(key) !== - 1 )
        
        for(const map of maps)
        {
            if(map && this.keys[map.name])
            {
                delete this.keys[map.name]
                this.events.trigger('keyUp', [ { down: false, name: map.name } ])
                this.events.trigger(map.name, [ { down: false, name: map.name } ])
            }
        }
    }

    change(key, value = 1)
    {
        const maps = this.map.filter((_map) => _map.keys.indexOf(key) !== - 1 )
        
        for(const map of maps)
        {
            if(map && this.keys[map.name] && this.checkCategory(map) && this.keys[map.name] !== value)
            {
                this.keys[map.name] = value
            }
        }
    }

    setFilters(filters = [])
    {
        this.filters = filters
    }

    update()
    {
        this.pointer.update()
        this.gamepad.update()
    }
}
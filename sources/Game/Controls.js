import { Events } from './Events.js'

export class Controls
{
    constructor()
    {
        this.events = new Events()

        this.map = [
            { name: 'up', keys: [ 'ArrowUp', 'KeyW' ] },
            { name: 'right', keys: [ 'ArrowRight', 'KeyD' ] },
            { name: 'down', keys: [ 'ArrowDown', 'KeyS' ] },
            { name: 'left', keys: [ 'ArrowLeft', 'KeyA' ] },
            { name: 'jump', keys: [ 'Space' ] },
        ]

        this.keys = {}

        for(const _map of this.map)
        {
            this.keys[_map.name] = false
        }

        addEventListener('keydown', (_event) =>
        {
            this.down(_event.code)
        })

        addEventListener('keyup', (_event) =>
        {
            this.up(_event.code)
        })
    }

    down(key)
    {
        const map = this.map.find((_map) => _map.keys.indexOf(key) !== - 1 )

        if(map && !this.keys[map.name])
        {
            this.keys[map.name] = true
            this.events.trigger(map.name, [ true ])
        }
    }

    up(key)
    {
        const map = this.map.find((_map) => _map.keys.indexOf(key) !== - 1 )

        if(map && this.keys[map.name])
        {
            this.keys[map.name] = false
            this.events.trigger(map.name, [ false ])
        }
    }
}
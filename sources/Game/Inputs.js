import { Events } from './Events.js'

export class Inputs
{
    constructor(_map)
    {
        this.events = new Events()

        this.map = _map

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
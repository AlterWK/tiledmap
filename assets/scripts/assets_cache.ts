class Entity {
    index: string = '';
    value: cc.Asset = null;

    pre: Entity = null;
    next: Entity = null;

    constructor(index: string, value: cc.Asset) {
        this.index = index;
        this.value = value;
    }
}

class LRUCache {
    capacity: number = 100;
    head: Entity = null;
    tail: Entity = null;
    map: Map<string, Entity> = new Map<string, Entity>();

    constructor(capacity: number) {
        this.capacity = capacity;
        this.head = new Entity('', null);
        this.tail = new Entity('', null);
        this.head.next = this.tail;
        this.tail.pre = this.head;
    }

    get(key: string) {
        if (this.map.has(key)) {
            let entity = this.map.get(key);
            this.refresh(entity);
            return entity.value;
        }
        return null;
    }

    put(key: string, value: cc.Asset) {
        let entity: Entity = null;
        if (this.map.has(key)) {
            entity = this.map.get(key);
            entity.value = value;
        } else {
            if (this.map.size == this.capacity) {
                let del = this.tail.pre;
                while (del.pre) {
                    let asset = del.value;
                    if (asset.refCount == 1) {
                        asset.decRef();
                        cc.assetManager.releaseAsset(asset);
                        console.log('释放资源', asset.name);
                        break;
                    }
                    del = del.pre;
                }
                //!: 这里会导致经常加载的资源不释放
                this.map.delete(del.index);
                this.delete(del);
            }
            entity = new Entity(key, value);
            this.map.set(key, entity);
        }
        value.addRef();
        this.refresh(entity);
    }

    refresh(entity: Entity) {
        this.delete(entity);
        entity.next = this.head.next;
        entity.pre = this.head;
        this.head.next.pre = entity;
        this.head.next = entity;
    }

    delete(entity: Entity) {
        if (entity.pre) {
            let pre = entity.pre;
            pre.next = entity.next;
            entity.next.pre = pre;
        }
    }
}

export const theAssetsCache = new LRUCache(100);

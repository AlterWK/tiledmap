export namespace utility {
    export function loadResources<T extends cc.Asset>(bundle: cc.AssetManager.Bundle, names: string[], type: typeof cc.Asset) {
        let promises: Promise<T>[] = [];
        for (let name of names) {
            promises.push(
                new Promise((resolve) => {
                    bundle.load(name, type, (err, res: any) => {
                        resolve(res);
                    });
                })
            );
        }
        return Promise.all(promises);
    }

    export function createAnimationWithFrames(frames: cc.SpriteFrame[], name: string) {
        let nodeRole: cc.Node = new cc.Node('nodeRole');
        nodeRole.addComponent(cc.Sprite);
        let animation = nodeRole.addComponent(cc.Animation);
        let clip: cc.AnimationClip = cc.AnimationClip.createWithSpriteFrames(frames, frames.length);
        clip.wrapMode = cc.WrapMode.Loop;
        clip.name = name;
        animation.addClip(clip);
        animation.play(name);
        return nodeRole;
    }

    export function attachAnimationClip(animation: cc.Animation, frames: cc.SpriteFrame[], name: string) {
        let clip: cc.AnimationClip = cc.AnimationClip.createWithSpriteFrames(frames, frames.length);
        clip.wrapMode = cc.WrapMode.Loop;
        clip.name = name;
        animation.addClip(clip);
        animation.play(name);
    }

    export function randomRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    export function randomRangeInt(min: number, max: number) {
        return Math.floor(randomRange(min, max));
    }

    export function clamp(value: number, min: number, max: number) {
        return value > max ? max : value > min ? value : min;
    }

    export function loadRes(path: string, type: typeof cc.Asset) {
        return new Promise<any>((resolve) => {
            cc.resources.load(path, type, (err, res) => {
                if (err) {
                    console.error(err);
                }
                resolve(res);
            });
        });
    }

    export function parseAnimationFromAtlas(atlas: cc.SpriteAtlas) {
        let ret: Map<string, string[]> = new Map<string, string[]>();
        let frameNames: string[] = atlas.getSpriteFrames().map((frame) => {
            return frame.name;
        });
        let regx = /^(\d+)-(\d+)_(\w+)_(\d+)$/;
        for (let name of frameNames) {
            let [_1, id, _3, clip, index] = name.match(regx) || [];
            if (!_1) {
                continue;
            }
            if (!ret.has(id)) {
                ret.set(id, []);
            }
            let idx = Number(index);
            let clips = ret.get(id);
            if (idx == 6) {
                clips.push(clip);
            }
        }
        return ret;
    }

    export function createOneAnimation(anims: Map<string, string[]>, atlas: cc.SpriteAtlas) {
        let i = utility.randomRangeInt(0, anims.size);
        let keys: string[] = [];
        anims.forEach((v, k) => {
            keys.push(k);
        });
        let id = keys[i];
        let clips = anims.get(id);
        let clip = clips[utility.randomRangeInt(0, clips.length)];
        let frames: cc.SpriteFrame[] = [];
        for (let i = 0; i < 6; ++i) {
            frames.push(atlas.getSpriteFrame(`${id}-${id}_${clip}_000${i + 1}`));
        }
        let animation = utility.createAnimationWithFrames(frames, clip);
        return animation;
    }

    export function createOneSprite(atlas: cc.SpriteAtlas, frameName: string, name: string) {
        let node = new cc.Node(name);
        let spr = node.addComponent(cc.Sprite);
        spr.trim = false;
        spr.sizeMode = cc.Sprite.SizeMode.RAW;
        spr.spriteFrame = atlas.getSpriteFrame(frameName);
        return node;
    }

    export function createOneLayout(config: { type: cc.Layout.Type; mode: cc.Layout.ResizeMode; spacingX: number; spacingY: number }) {
        let node: cc.Node = new cc.Node('layout');
        let layout = node.addComponent(cc.Layout);
        layout.type = config.type;
        layout.resizeMode = config.mode;
        layout.spacingX = config.spacingX;
        layout.spacingY = config.spacingY;
        return node;
    }

    export function indexOf<T>(array: Array<T>, predicate: T | ((v: T) => boolean)) {
        for (let i = 0; i < array.length; ++i) {
            if (predicate instanceof Function) {
                if (predicate(array[i])) {
                    return i;
                }
            } else if (predicate === array[i]) {
                return i;
            }
        }
        return -1;
    }

    //!: 使用start代替click注册点击，让按钮触发优先于鼠标点击
    export function addClickEventListener(node: cc.Node, callback: (event: cc.Event.EventTouch, ...args) => void, target?: Object, ...args) {
        node.on(
            cc.Node.EventType.TOUCH_START,
            function (event: cc.Event.EventTouch) {
                callback.call(this, event, ...args);
            },
            target
        );
    }
}

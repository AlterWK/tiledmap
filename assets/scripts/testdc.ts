import { theAssetsCache } from './assets_cache';
import { CityConfig } from './testcpu';
import { utility } from './utility';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TestDc extends cc.Component {
    @property(cc.Slider)
    sliderItem: cc.Slider = null;
    @property(cc.Slider)
    sliderRole: cc.Slider = null;
    @property(cc.Slider)
    sliderWall: cc.Slider = null;
    @property(cc.Label)
    labelDC: cc.Label = null;
    @property(cc.Label)
    labelFPS: cc.Label = null;
    @property(cc.Node)
    panelUI: cc.Node = null;

    readonly COUNT: number = 30;
    readonly MAX_NUMS: number = 200;

    nodeItems: cc.Node[] = [];
    nodeWalls: cc.Node[] = [];
    nodeRoles: cc.Node[] = [];

    count: number = 0;
    time: number = 0;

    start() {
        this.sliderItem.node.on('slide', this.onSlideItem, this);
        this.sliderRole.node.on('slide', this.onSlideRole, this);
        this.sliderWall.node.on('slide', this.onSlideWall, this);
    }

    onSlideItem() {
        let process = this.sliderItem.progress;
        let count = Math.floor(this.MAX_NUMS * process);
        this.sliderItem.node.getChildByName('labelCount').getComponent(cc.Label).string = count + '';

        let diff = this.nodeItems.length - count;
        if (diff > 0) {
            for (let i = this.nodeItems.length - 1; i >= 0; i--) {
                this.nodeItems[i].removeFromParent();
                this.nodeItems.splice(i, 1);
                diff--;
                if (diff <= 0) {
                    break;
                }
            }
            return;
        } else {
            count = count - this.nodeItems.length;
        }

        let bundles = ['icon', 'role', 'wall'];
        for (let i = 0; i < bundles.length; ++i) {
            cc.assetManager.loadBundle(bundles[i], (err, bundle) => {
                let keys = Object.keys(bundle['_config'].paths._map);
                let size = Math.ceil(count / 3);
                for (let j = 0; j < size; ++j) {
                    bundle.load(keys[utility.randomRangeInt(0, keys.length)], cc.SpriteFrame, (err, frame: cc.SpriteFrame) => {
                        if (this.nodeItems.length >= this.MAX_NUMS) {
                            return;
                        }
                        if (err) {
                            return;
                        }
                        theAssetsCache.put(frame['_uuid'], frame);
                        let node = new cc.Node('item');
                        let spr = node.addComponent(cc.Sprite);
                        spr.trim = false;
                        spr.sizeMode = cc.Sprite.SizeMode.RAW;
                        spr.spriteFrame = frame;
                        node.x = utility.randomRangeInt(-682, 682);
                        node.y = utility.randomRangeInt(-384, 384);
                        node.zIndex = -node.y;
                        this.panelUI.addChild(node);
                        this.nodeItems.push(node);
                    });
                }
            });
        }
    }

    onSlideRole() {
        let process = this.sliderRole.progress;
        let count = Math.floor(this.MAX_NUMS * process);
        this.sliderRole.node.getChildByName('labelCount').getComponent(cc.Label).string = count + '';

        let diff = this.nodeRoles.length - count;
        if (diff > 0) {
            for (let i = this.nodeRoles.length - 1; i >= 0; i--) {
                this.nodeRoles[i].removeFromParent();
                this.nodeRoles.splice(i, 1);
                diff--;
                if (diff <= 0) {
                    break;
                }
            }
            return;
        } else {
            count = count - this.nodeRoles.length;
        }

        let numAtlas = utility.randomRangeInt(1, CityConfig.role.length);
        for (let i = 0; i < numAtlas; ++i) {
            utility.loadRes(CityConfig.role[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let anims = utility.parseAnimationFromAtlas(atlas);
                let size = Math.ceil(count / numAtlas);
                for (let j = 0; j < size; ++j) {
                    if (this.nodeRoles.length >= this.MAX_NUMS) {
                        return;
                    }
                    let animation = utility.createOneAnimation(anims, atlas);
                    animation.x = utility.randomRangeInt(-682, 682);
                    animation.y = utility.randomRangeInt(-384, 384);
                    animation.zIndex = -animation.y;
                    this.panelUI.addChild(animation);
                    this.nodeRoles.push(animation);
                }
            });
        }
    }

    onSlideWall() {
        let process = this.sliderWall.progress;
        let count = Math.floor(this.MAX_NUMS * process);
        this.sliderWall.node.getChildByName('labelCount').getComponent(cc.Label).string = count + '';

        let diff = this.nodeWalls.length - count;
        if (diff > 0) {
            for (let i = this.nodeWalls.length - 1; i >= 0; i--) {
                this.nodeWalls[i].removeFromParent();
                this.nodeWalls.splice(i, 1);
                diff--;
                if (diff <= 0) {
                    break;
                }
            }
            return;
        } else {
            count = count - this.nodeWalls.length;
        }

        let numAtlas = utility.randomRangeInt(1, CityConfig.wall.length);
        for (let i = 0; i < numAtlas; ++i) {
            utility.loadRes(CityConfig.wall[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                let size = Math.ceil(count / numAtlas);
                for (let j = 0; j < size; ++j) {
                    if (this.nodeWalls.length >= this.MAX_NUMS) {
                        return;
                    }
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'wall');
                    node.x = utility.randomRangeInt(-682, 682);
                    node.y = utility.randomRangeInt(-384, 384);
                    node.zIndex = -node.y;
                    this.panelUI.addChild(node);
                    this.nodeWalls.push(node);
                }
            });
        }
    }

    protected update(dt: number): void {
        ++this.count;
        this.time += dt;
        if (this.count == this.COUNT) {
            this.labelDC.string = 'DC:' + cc.renderer.drawCalls;
            this.labelFPS.string = 'FPS:' + Math.min(240, 1 / (this.time / this.COUNT) + 0.05).toFixed(2);
            this.count = 0;
            this.time = 0;
        }
    }
}

import { theAssetsCache } from './assets_cache';
import Role from './role';
import { utility } from './utility';

const { ccclass, property } = cc._decorator;

export const CityConfig = {
    floor: ['pictures/home_base'],
    home: ['pictures/home_1', 'pictures/home_2'],
    office: ['pictures/office_1', 'pictures/office_2', 'pictures/office_3', 'pictures/office_4'],
    decorator: ['pictures/icon_house', 'pictures/icon_build'],
    building: ['pictures/build'],
    wall: ['pictures/wall_door'],
    role: ['pictures/role_1', 'pictures/role_2', 'pictures/role_3'],
};

@ccclass
export default class TestCPU extends cc.Component {
    @property(cc.Node)
    panelMain: cc.Node = null;
    @property(cc.Node)
    panelFloor: cc.Node = null;
    @property(cc.Node)
    panelHome: cc.Node = null;
    @property(cc.Node)
    panelOffice: cc.Node = null;
    @property(cc.Node)
    panelRoleDown: cc.Node = null;
    @property(cc.Node)
    panelDecorator: cc.Node = null;
    @property(cc.Node)
    panelBuilding: cc.Node = null;
    @property(cc.Node)
    panelWall: cc.Node = null;
    @property(cc.Node)
    panelRoleUp: cc.Node = null;
    @property(cc.Node)
    panelItem: cc.Node = null;
    @property(cc.Node)
    btnChange: cc.Node = null;

    readonly WIDTH: number = 2048;
    readonly HEIGHT: number = 2048;

    loadRes(path: string, type: typeof cc.Asset) {
        return new Promise<any>((resolve) => {
            cc.resources.load(path, type, (err, res) => {
                if (err) {
                    console.error(err);
                }
                resolve(res);
            });
        });
    }

    onLoad() {
        this.init();
    }

    init() {
        this.initUI();
        this.registerEvents();
    }

    initUI() {
        this.drawFloor();
        this.drawHome();
        this.drawOffice();
        this.drawDecorator();
        this.drawBuilding();
        this.drawWall();
        this.drawRole();
        this.drawItem();
    }

    registerEvents() {
        this.panelMain.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        this.panelMain.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        this.btnChange.on('click', this.onBtnChage, this);
    }

    onTouchStart(event: cc.Event.EventTouch) {}

    onTouchMoved(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        let pos = this.panelMain.position.add(cc.v3(delta.x, delta.y));
        let maxDiffX = (this.panelMain.width - cc.view.getDesignResolutionSize().width) / 2;
        let maxDiffY = (this.panelMain.height - cc.view.getDesignResolutionSize().height) / 2;
        this.panelMain.x = utility.clamp(pos.x, -maxDiffX, maxDiffX);
        this.panelMain.y = utility.clamp(pos.y, -maxDiffY, maxDiffY);
    }

    onTouchEnded(event: cc.Event.EventTouch) {}

    onTouchCancel(event: cc.Event.EventTouch) {}

    onBtnChage() {
        console.log('click change');
        this.refresh();
    }

    drawFloor() {
        let layouts = utility.createOneLayout({ type: cc.Layout.Type.VERTICAL, mode: cc.Layout.ResizeMode.CONTAINER, spacingX: 0, spacingY: -5 });
        layouts.width = this.WIDTH;
        this.panelFloor.addChild(layouts);
        let cellSize: number = 100;
        let num = Math.ceil(this.WIDTH / (cellSize - 5));
        this.loadRes('pictures/home_base', cc.SpriteAtlas).then((atlas) => {
            let frames = atlas.getSpriteFrames().map((frame) => {
                return frame.name;
            });
            let frameName = frames[utility.randomRangeInt(0, frames.length)];
            for (let i = 0; i < num; ++i) {
                let layout = utility.createOneLayout({ type: cc.Layout.Type.HORIZONTAL, mode: cc.Layout.ResizeMode.CONTAINER, spacingX: -5, spacingY: 0 });
                layout.height = cellSize;
                for (let j = 0; j < num; ++j) {
                    let nodeFloor = new cc.Node('floor');
                    let sprFloor = nodeFloor.addComponent(cc.Sprite);
                    sprFloor.trim = false;
                    sprFloor.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    nodeFloor.setContentSize(cc.size(cellSize, cellSize));
                    sprFloor.spriteFrame = atlas.getSpriteFrame(frameName);
                    layout.addChild(nodeFloor);
                }
                layouts.addChild(layout);
            }
        });
    }

    drawHome() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.home.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.home[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                for (let j = 0; j < 30; ++j) {
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'home');
                    node.x = utility.randomRangeInt(-1024, 1024);
                    node.y = utility.randomRangeInt(-1024, 1024);
                    let nodeSub = this.panelHome.getChildByName('subHome_' + i);
                    if (!nodeSub) {
                        nodeSub = new cc.Node('subHome_' + i);
                        this.panelHome.addChild(nodeSub);
                    }
                    nodeSub.addChild(node);
                }
            });
        }
    }

    drawOffice() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.office.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.office[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                for (let j = 0; j < 30; ++j) {
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'office');
                    node.x = utility.randomRangeInt(-1024, 1024);
                    node.y = utility.randomRangeInt(-1024, 1024);
                    let nodeSub = this.panelOffice.getChildByName('subOffice_' + i);
                    if (!nodeSub) {
                        nodeSub = new cc.Node('subOffice_' + i);
                        this.panelOffice.addChild(nodeSub);
                    }
                    nodeSub.addChild(node);
                }
            });
        }
    }

    drawDecorator() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.decorator.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.decorator[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                for (let j = 0; j < 30; ++j) {
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'decorator');
                    node.x = utility.randomRangeInt(-1024, 1024);
                    node.y = utility.randomRangeInt(-1024, 1024);
                    let nodeSub = this.panelDecorator.getChildByName('subDecorator_' + i);
                    if (!nodeSub) {
                        nodeSub = new cc.Node('subDecorator_' + i);
                        this.panelDecorator.addChild(nodeSub);
                    }
                    nodeSub.addChild(node);
                }
            });
        }
    }

    drawBuilding() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.building.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.building[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                for (let j = 0; j < 30; ++j) {
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'building');
                    node.x = utility.randomRangeInt(-1024, 1024);
                    node.y = utility.randomRangeInt(-1024, 1024);
                    let nodeSub = this.panelBuilding.getChildByName('subBuilding_' + i);
                    if (!nodeSub) {
                        nodeSub = new cc.Node('subBuilding_' + i);
                        this.panelBuilding.addChild(nodeSub);
                    }
                    nodeSub.addChild(node);
                }
            });
        }
    }

    drawWall() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.wall.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.wall[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let frames = atlas.getSpriteFrames().map((frame) => {
                    return frame.name;
                });
                for (let j = 0; j < 30; ++j) {
                    let node = utility.createOneSprite(atlas, frames[utility.randomRangeInt(0, frames.length)], 'wall');
                    node.x = utility.randomRangeInt(-1024, 1024);
                    node.y = utility.randomRangeInt(-1024, 1024);
                    let nodeSub = this.panelWall.getChildByName('subWall_' + i);
                    if (!nodeSub) {
                        nodeSub = new cc.Node('subWall_' + i);
                        this.panelWall.addChild(nodeSub);
                    }
                    nodeSub.addChild(node);
                }
            });
        }
    }

    drawRole() {
        let numAtlas = utility.randomRangeInt(1, CityConfig.role.length);
        for (let i = 0; i < numAtlas; ++i) {
            this.loadRes(CityConfig.role[i], cc.SpriteAtlas).then((atlas: cc.SpriteAtlas) => {
                let anims = utility.parseAnimationFromAtlas(atlas);
                for (let j = 0; j < 40; ++j) {
                    let animation = utility.createOneAnimation(anims, atlas);
                    animation.x = utility.randomRangeInt(-400, 400);
                    animation.y = utility.randomRangeInt(-400, 400);
                    let nodeSubRoleDown = this.panelRoleDown.getChildByName('subRoleDown_' + i);
                    if (!nodeSubRoleDown) {
                        nodeSubRoleDown = new cc.Node('subRoleDown_' + i);
                        this.panelRoleDown.addChild(nodeSubRoleDown);
                    }
                    let nodeSubRoleUp = this.panelRoleUp.getChildByName('subRoleUp_' + i);
                    if (!nodeSubRoleUp) {
                        nodeSubRoleUp = new cc.Node('subRoleUp_' + i);
                        this.panelRoleUp.addChild(nodeSubRoleUp);
                    }
                    let role = animation.addComponent(Role);
                    role.up = nodeSubRoleUp;
                    role.down = nodeSubRoleDown;
                    nodeSubRoleDown.addChild(animation);
                    role.move();
                }
            });
        }
    }

    drawItem() {
        let bundles = ['icon', 'role', 'wall'];
        for (let i = 0; i < bundles.length; ++i) {
            cc.assetManager.loadBundle(bundles[i], (err, bundle) => {
                let keys = Object.keys(bundle['_config'].paths._map);
                for (let j = 0; j < 30; ++j) {
                    bundle.load(keys[utility.randomRangeInt(0, keys.length)], cc.SpriteFrame, (err, frame: cc.SpriteFrame) => {
                        if (err) {
                            return;
                        }
                        theAssetsCache.put(frame['_uuid'], frame);
                        let node = new cc.Node('item');
                        let spr = node.addComponent(cc.Sprite);
                        spr.trim = false;
                        spr.sizeMode = cc.Sprite.SizeMode.RAW;
                        spr.spriteFrame = frame;
                        node.x = utility.randomRangeInt(-1024, 1024);
                        node.y = utility.randomRangeInt(-1024, 1024);
                        this.panelItem.addChild(node);
                    });
                }
            });
        }
    }

    refresh() {
        this.panelFloor.removeAllChildren();
        this.panelHome.removeAllChildren();
        this.panelBuilding.removeAllChildren();
        this.panelWall.removeAllChildren();
        this.panelDecorator.removeAllChildren();
        this.panelRoleDown.removeAllChildren();
        this.panelRoleUp.removeAllChildren();
        this.panelOffice.removeAllChildren();
        this.panelItem.removeAllChildren();

        this.initUI();
    }
}

cc.dynamicAtlasManager.enabled = true;
cc.macro.CLEANUP_IMAGE_CACHE = false;

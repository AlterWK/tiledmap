import Role from './role';
import { utility } from './utility';

const { ccclass, property } = cc._decorator;

enum Direction {
    LEFT = 0b0010,
    FRONT = 0b0001,
    BACK = 0b1000,
    RIGHT = 0b0100,
}

enum MouseBtn {
    LEFT = 0,
    WHELL = 1,
    RIGHT = 2,
}

@ccclass
export default class Game extends cc.Component {
    @property(cc.Node)
    panelMain: cc.Node = null;
    @property(cc.Node)
    panelUI: cc.Node = null;
    @property(cc.Node)
    panelIndex: cc.Node = null;
    @property(cc.TiledMap)
    tiledMap: cc.TiledMap = null;
    @property(cc.Node)
    panelTop: cc.Node = null;
    @property(cc.Node)
    listBundles: cc.Node = null;
    @property(cc.Node)
    listItems: cc.Node = null;
    @property(cc.Node)
    nodeEditPath: cc.Node = null;
    @property(cc.Node)
    nodeFlag: cc.Node = null;
    @property(cc.Node)
    nodeAdjustAnchorPoint: cc.Node = null;
    @property(cc.Label)
    labelRowCol: cc.Label = null;
    @property(cc.Node)
    panelAnchor: cc.Node = null;

    mapSize: cc.Size = null;
    tileSize: cc.Size = null;
    scale: number = 1;
    isPressCtrl: boolean = false;
    isEditPath: boolean = false;
    canMoveMap: boolean = false;
    polygons: cc.Vec2[][] = [];

    bundles: cc.AssetManager.Bundle[] = [];
    curSelectBundle: cc.AssetManager.Bundle = null;
    curSelectContent: cc.Node = null;
    curSelectRole: cc.Node = null;
    curNodePath: cc.Node[] = [];

    usedMap: Map<string, cc.Node[]> = new Map<string, cc.Node[]>();
    anchorPointCache: { [index: string]: cc.Vec2 } = {};

    readonly MAX_SCALE: number = 3;
    readonly MIN_SCALE: number = 0.8;

    protected start(): void {
        this.initData();
        this.initUI();
        this.registerEvents();
    }

    initData() {
        this.mapSize = this.tiledMap.getMapSize();
        this.tileSize = this.tiledMap.getTileSize();
        this.initPolygon();
        this.initBundles();
    }

    initBundles() {
        let bundleNames = ['doors', 'wall', 'units', 'role_1', 'role_2', 'role_3'];
        let promises: Promise<cc.AssetManager.Bundle>[] = [];
        for (let name of bundleNames) {
            promises.push(
                new Promise((resolve) => {
                    cc.assetManager.loadBundle(name, (err, bundle) => {
                        resolve(bundle);
                    });
                })
            );
        }
        Promise.all(promises).then((bundles) => {
            this.bundles = bundles;
            console.log('load bundles success');
        });
    }

    initUI() {
        let children = this.listBundles.getComponent(cc.ScrollView).content.children;
        for (let child of children) {
            utility.addClickEventListener(child, this.onNodeBundle, this);
        }
        this.panelAnchor.getChildByName('editboxAnchorX').on('editing-did-ended', this.onEditAnchorX, this);
        this.panelAnchor.getChildByName('editboxAnchorY').on('editing-did-ended', this.onEditAnchorY, this);

        this.drawAnchorGrids();
    }

    drawAnchorGrids() {
        let graphics = new cc.Node('nodGraphics').addComponent(cc.Graphics);
        graphics.lineWidth = 5;
        graphics.strokeColor = cc.Color.WHITE;
        this.panelAnchor.addChild(graphics.node);

        graphics.moveTo(-128, 0);
        graphics.lineTo(0, 64);
        graphics.moveTo(0, 64);
        graphics.lineTo(128, 0);
        graphics.moveTo(128, 0);
        graphics.lineTo(0, -64);
        graphics.moveTo(0, -64);
        graphics.lineTo(-128, 0);

        graphics.moveTo(-96, 16);
        graphics.lineTo(32, -48);
        graphics.moveTo(-64, 32);
        graphics.lineTo(64, -32);
        graphics.moveTo(-32, 48);
        graphics.lineTo(96, -16);

        graphics.moveTo(-96, -16);
        graphics.lineTo(32, 48);
        graphics.moveTo(-64, -32);
        graphics.lineTo(64, 32);
        graphics.moveTo(-32, -48);
        graphics.lineTo(96, 16);

        graphics.stroke();
    }

    registerEvents() {
        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
            this.panelMain.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.panelMain.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
            this.panelMain.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
            this.panelMain.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        } else {
            this.panelMain.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.panelMain.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
            this.panelMain.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
            this.panelMain.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWhell, this);

            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        }
        utility.addClickEventListener(this.nodeEditPath, this.onEditPath, this);
        utility.addClickEventListener(this.nodeAdjustAnchorPoint, this.onAdjustAnchorPoint, this);
    }

    initPolygon() {
        let tiledLayer = this.tiledMap.getLayer('floor_1');
        let count: number = 0;
        for (let row = 0; row < this.mapSize.height; ++row) {
            for (let col = 0; col < this.mapSize.width; ++col) {
                let pos = tiledLayer.getPositionAt(col, row);
                let node = new cc.Node();
                node.position = cc.v3(pos.x + this.tileSize.width / 2, pos.y + this.tileSize.height / 2);
                this.polygons.push([
                    cc.v2(pos.x, pos.y + this.tileSize.height / 2),
                    cc.v2(pos.x + this.tileSize.width / 2, pos.y + this.tileSize.height),
                    cc.v2(pos.x + this.tileSize.width, pos.y + this.tileSize.height / 2),
                    cc.v2(pos.x + this.tileSize.width / 2, pos.y),
                ]);
                let label = node.addComponent(cc.Label);
                node.setAnchorPoint(0.5, 0.5);
                label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                label.verticalAlign = cc.Label.VerticalAlign.CENTER;
                label.fontSize = 12;
                node.color = cc.Color.BLACK;
                label.string = 'index_' + count;
                count++;
                label.cacheMode = cc.Label.CacheMode.CHAR;
                this.panelIndex.addChild(node);
            }
        }
        this.panelIndex.active = false;
    }

    addOneItemWithLocation(location: cc.Vec2) {
        if (!this.curSelectContent) {
            return;
        }

        let { row, col } = this.calculateRowCol(location);
        if (row < 0 || col < 0) {
            return;
        }

        if (!this.usedMap.has(`${row}_${col}`)) {
            this.usedMap.set(`${row}_${col}`, []);
        }
        let items = this.usedMap.get(`${row}_${col}`);
        if (
            utility.indexOf(items, (node) => {
                return node.name == this.curSelectContent.name;
            }) >= 0
        ) {
            return;
        }

        let item = cc.instantiate(this.curSelectContent);
        let pos = this.tiledMap.getLayer('floor_1').getPositionAt(col, row);
        let [_, direction] = this.curSelectContent.name.match(/_(\d)$/) || [];
        this.adjustItemPos(cc.v3(pos.x, pos.y), item, Number(direction || Direction.BACK));
        this.panelUI.addChild(item);
        item.zIndex = Math.floor(item.x / 100) - Math.floor(item.y);
        items.push(item);

        let isRole: boolean = false;
        if (this.curSelectBundle.name == 'role_1' || this.curSelectBundle.name == 'role_2' || this.curSelectBundle.name == 'role_3') {
            let animation = item.addComponent(cc.Animation);
            let regx = /^(\d+)-(\d+)_(\w+)_(\d+)$/;
            let [_1, id, _3, clip, index] = this.curSelectContent.name.match(regx) || [];
            let names: string[] = [];
            for (let i = 0; i < 6; ++i) {
                names.push(`${id}-${id}_${clip}_000${i + 1}`);
            }
            utility.loadResources<cc.SpriteFrame>(this.curSelectBundle, names, cc.SpriteFrame).then((frames) => {
                if (!cc.isValid(animation)) {
                    return;
                }
                utility.attachAnimationClip(animation, frames, clip);
            });
            item.addComponent(Role);
            isRole = true;
        }
        utility.addClickEventListener(item, this.onNodeItem, this, isRole);
    }

    addOneNodePath(location: cc.Vec2) {
        if (!this.isEditPath || !this.nodeFlag.active) {
            return;
        }
        let { row, col } = this.calculateRowCol(location);
        if (row < 0 || col < 0) {
            return;
        }
        let item = cc.instantiate(this.nodeFlag);
        let pos = this.tiledMap.getLayer('floor_1').getPositionAt(col, row);
        this.adjustItemPos(cc.v3(pos.x, pos.y), item, Number(Direction.BACK));
        if (
            utility.indexOf(this.curNodePath, (node) => {
                return node.x == item.x && node.y == item.y;
            }) >= 0
        ) {
            item.destroy();
            return;
        }
        this.panelUI.addChild(item);
        item.zIndex = Math.floor(item.x / 100) - Math.floor(item.y);
        this.curNodePath.push(item);
    }

    onNodeItem(event: cc.Event.EventTouch, isRole: boolean) {
        if (isRole) {
            this.curSelectRole = event.target;
        }
    }

    onTouchStart(event: cc.Event.EventTouch) {
        let touches = event.getTouches();
        if (touches.length === 2) {
            this.zoomMapWithTouches(touches);
        } else if (touches.length === 1) {
            this.addOneItemWithLocation(event.getLocation());
        }
    }

    onTouchMoved(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        this.moveMainMap(delta);
    }

    onTouchEnded(event: cc.Event.EventTouch) {}

    onTouchCancel(event: cc.Event.EventTouch) {}

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.ctrl:
                this.isPressCtrl = true;
                break;
            default:
                // console.log(`current push keycode:${cc.macro.KEY[event.keyCode]}`);
                break;
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.ctrl:
                this.isPressCtrl = false;
                break;
            case cc.macro.KEY.s:
                this.panelIndex.active = !this.panelIndex.active;
                break;
            case cc.macro.KEY.h:
                this.panelTop.active = !this.panelTop.active;
                break;
            default:
                // console.log(`current release keycode:${cc.macro.KEY[event.keyCode]}`);
                break;
        }
    }

    onMouseDown(event: cc.Event.EventMouse) {
        this.calculateRowCol(event.getLocation());
        let type = event.getButton();
        if (type == MouseBtn.LEFT) {
            this.addOneItemWithLocation(event.getLocation());
            this.addOneNodePath(event.getLocation());
        }
        if (type == MouseBtn.RIGHT) {
            this.canMoveMap = true;
        }
        if (type == MouseBtn.WHELL) {
            this.curSelectContent && this.curSelectContent.removeFromParent();
            this.curSelectContent = null;
        }
    }

    onMouseUp(event: cc.Event.EventMouse) {
        let type = event.getButton();
        if (type === MouseBtn.RIGHT) {
            this.canMoveMap = false;
        }
    }

    onMouseMove(event: cc.Event.EventMouse) {
        let { row, col } = this.calculateRowCol(event.getLocation());
        this.labelRowCol.string = `ROW:${row}, COL:${col}`;
        if (this.curSelectContent) {
            let pos = this.tiledMap.getLayer('floor_1').getPositionAt(col, row);
            let [_, direction] = this.curSelectContent.name.match(/_(\d)$/) || [];
            this.adjustItemPos(cc.v3(pos.x, pos.y), this.curSelectContent, Number(direction || Direction.BACK));
            this.curSelectContent.zIndex = Math.floor(this.curSelectContent.x / 100) - Math.floor(this.curSelectContent.y);
        }
        if (this.curSelectRole) {
            let pos = this.tiledMap.getLayer('floor_1').getPositionAt(col, row);
            this.adjustItemPos(cc.v3(pos.x, pos.y), this.nodeFlag, Number(Direction.BACK));
            this.nodeFlag.zIndex = Math.floor(this.nodeFlag.x / 100) - Math.floor(this.nodeFlag.y);
        }
        if (this.canMoveMap) {
            this.moveMainMap(event.getDelta());
        }
    }

    onMouseWhell(event: cc.Event.EventMouse) {
        this.zoomMapWithWhell(event);
    }

    onNodeBundle(event: cc.Event.EventTouch) {
        if (this.bundles.length <= 0) {
            return;
        }
        let index = utility.indexOf(this.bundles, (bundle) => {
            return bundle.name == event.target.name;
        });
        if (index < 0) {
            return;
        }
        this.curSelectBundle = this.bundles[index];
        if (this.curSelectBundle.name == 'wall') {
            this.updateWallItems();
        } else if (this.curSelectBundle.name == 'role_1' || this.curSelectBundle.name == 'role_2' || this.curSelectBundle.name == 'role_3') {
            this.updateRoleItems();
        } else if (this.curSelectBundle.name == 'units') {
            this.updateUnitsItems();
        } else if (this.curSelectBundle.name == 'doors') {
            this.updateDoorItems();
        }
    }

    updateWallItems() {
        this.listItems.getComponent(cc.ScrollView).content.removeAllChildren();
        let contents = this.parseBundleContents(this.curSelectBundle);
        for (let content in contents) {
            let layout = utility.createOneLayout({ type: cc.Layout.Type.HORIZONTAL, mode: cc.Layout.ResizeMode.CONTAINER, spacingX: 15, spacingY: 0 });
            layout.height = 90;
            layout.addChild(this.createOneContent(`wall_${content}_${Direction.LEFT}`));
            layout.addChild(this.createOneContent(`wall_${content}_${Direction.FRONT}`));
            layout.addChild(this.createOneContent(`wall_${content}_${Direction.RIGHT}`));
            layout.addChild(this.createOneContent(`wall_${content}_${Direction.BACK}`));
            this.listItems.getComponent(cc.ScrollView).content.addChild(layout);
        }
    }

    updateRoleItems() {
        this.listItems.getComponent(cc.ScrollView).content.removeAllChildren();
        let contents = Object.keys(this.parseBundleContents(this.curSelectBundle));
        for (let i = 0; i < contents.length; i += 4) {
            let layout = utility.createOneLayout({ type: cc.Layout.Type.HORIZONTAL, mode: cc.Layout.ResizeMode.CONTAINER, spacingX: 15, spacingY: 0 });
            layout.height = 90;
            for (let j = 0; j < 4; ++j) {
                if (!contents[i + j]) {
                    break;
                }
                layout.addChild(this.createOneContent(`${contents[i + j]}-${contents[i + j]}_awb_0001`));
            }
            this.listItems.getComponent(cc.ScrollView).content.addChild(layout);
        }
    }

    updateDoorItems() {
        this.listItems.getComponent(cc.ScrollView).content.removeAllChildren();
        let contents = this.parseBundleContents(this.curSelectBundle);
        for (let content in contents) {
            this.listItems.getComponent(cc.ScrollView).content.addChild(this.createOneContent(`door_${content}_1`));
        }
    }

    updateUnitsItems() {
        this.listItems.getComponent(cc.ScrollView).content.removeAllChildren();
        let contents = this.parseBundleContents(this.curSelectBundle);
        for (let content in contents) {
            this.listItems.getComponent(cc.ScrollView).content.addChild(this.createOneContent(content));
        }
    }

    createOneContent(content: string) {
        let nodeContent = new cc.Node(content);
        nodeContent.addComponent(cc.Sprite);
        utility.addClickEventListener(nodeContent, this.onNodeContent, this);
        this.curSelectBundle.load(content, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (cc.isValid(nodeContent)) {
                nodeContent.getComponent(cc.Sprite).spriteFrame = spriteFrame;
            }
        });
        return nodeContent;
    }

    parseBundleContents(bundle: cc.AssetManager.Bundle) {
        let keys = Object.keys(bundle['_config'].paths._map);
        let contents: { [index: string]: boolean } = {};
        if (bundle.name == 'wall') {
            let rege = /^(\w+)_(\d+)_(\d+)$/;
            for (let key of keys) {
                let [_1, _2, id, index] = key.match(rege) || [];
                if (!id || contents[id]) {
                    continue;
                }
                contents[id] = true;
            }
        } else if (bundle.name == 'role_1' || bundle.name == 'role_2' || bundle.name == 'role_3') {
            let regx = /^(\d+)-(\d+)_(\w+)_(\d+)$/;
            for (let key of keys) {
                let [_1, id, _3, clip, index] = key.match(regx) || [];
                if (!_1 || contents[id]) {
                    continue;
                }
                contents[id] = true;
            }
        } else if (bundle.name == 'doors') {
            for (let key of keys) {
                let regx = /^door_(\d+)_(\d+)$/;
                let [_1, id, index] = key.match(regx) || [];
                if (!_1 || contents[id]) {
                    continue;
                }
                contents[id] = true;
            }
        } else if (bundle.name == 'units') {
            for (let key of keys) {
                contents[key] = true;
            }
        }
        return contents;
    }

    onNodeContent(event: cc.Event.EventTouch) {
        if (this.curSelectContent) {
            this.curSelectContent.destroy();
            this.curSelectContent = null;
        }
        this.curSelectBundle.load(event.target.name, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            let node = new cc.Node(event.target.name);
            let spr = node.addComponent(cc.Sprite);
            spr.spriteFrame = spriteFrame;
            if (this.curSelectBundle.name == 'wall') {
                node.setAnchorPoint(this.anchorPointCache[node.name] || cc.v2(0.5, 0.1));
            } else if (this.curSelectBundle.name == 'role_1' || this.curSelectBundle.name == 'role_2' || this.curSelectBundle.name == 'role_3') {
                node.setAnchorPoint(this.anchorPointCache[node.name] || cc.v2(0.6, 0.1));
            } else {
                node.setAnchorPoint(this.anchorPointCache[node.name] || cc.v2(0.5, 0.5));
            }
            this.panelUI.addChild(node);
            this.curSelectContent = node;
        });
        console.log('click content');
    }

    updateMainScale(isZoom: boolean, rato: number) {
        let scaleTo: number = isZoom ? this.MAX_SCALE : this.MIN_SCALE;
        this.scale = cc.misc.lerp(this.panelMain.scale, scaleTo, rato);
        this.panelMain.scale = this.scale;
    }

    zoomMapWithTouches(touches: cc.Touch[]) {
        let first: cc.Vec2 = touches[0].getDelta();
        let second: cc.Vec2 = touches[1].getDelta();
        if (first.x < second.y) {
            let temp = first;
            first = second;
            second = temp;
        }
        let isZoom: boolean = first.x < 0 || first.y > 0;
        if (first.x * second.x < 0 || first.y * second.y < 0) {
            let rato = utility.clamp(first.lengthSqr() + second.lengthSqr(), 0, 1);
            this.updateMainScale(isZoom, rato);
        }
    }

    zoomMapWithWhell(event: cc.Event.EventMouse) {
        if (!this.isPressCtrl) {
            return;
        }
        let scrollY = event.getScrollY();
        let rato: number = utility.clamp(Math.abs(scrollY / 500), 0, 1);
        this.updateMainScale(scrollY > 0, rato);
    }

    adjustItemPos(pos: cc.Vec3, node: cc.Node, direction?: Direction) {
        //!: pos坐标相对于图片左下角，即 anchorPoint(0, 0)
        if (this.curSelectBundle.name == 'wall') {
            pos = pos.add(cc.v3(node.width * node.anchorX, node.height * node.anchorY));
        }
        if (this.curSelectBundle.name == 'units') {
            direction = Direction.FRONT;
        }
        if (direction == Direction.FRONT) {
            node.position = cc.v3(pos.x, pos.y);
        } else if (direction == Direction.BACK) {
            node.position = cc.v3(pos.x + this.tileSize.width / 2, pos.y + this.tileSize.height / 2);
        } else if (direction == Direction.RIGHT) {
            node.position = cc.v3(pos.x + this.tileSize.width / 2, pos.y);
        } else if (direction == Direction.LEFT) {
            node.position = cc.v3(pos.x, pos.y + this.tileSize.height / 2);
        } else {
            node.position = pos;
        }
    }

    calculateRowCol(location: cc.Vec2) {
        let pos = this.panelIndex.convertToNodeSpaceAR(location);

        let col = Math.floor((pos.x / this.tileSize.width) * 2);
        let row = Math.floor((pos.y / this.tileSize.height) * 2);

        let X = col * this.tileSize.width * 0.5;
        let Y = row * this.tileSize.height * 0.5;

        let K: number = 0,
            isLeft: boolean = false;
        if ((col % 2 == 1 && row % 2 == 0) || (col % 2 == 0 && row % 2 == 1)) {
            K = Y + 0.5 * X + this.tileSize.height * 0.5;
            isLeft = pos.y < K - pos.x * 0.5;
            if (isLeft) {
                X = X - this.tileSize.width * 0.5;
                Y = Y - this.tileSize.height * 0.5;
            }
        } else {
            K = Y - 0.5 * X;
            isLeft = pos.y > pos.x * 0.5 + K;
            if (isLeft) {
                X = X - this.tileSize.width * 0.5;
            } else {
                Y = Y - this.tileSize.height * 0.5;
            }
        }

        let r =
            (this.tileSize.width * this.tileSize.height * (this.mapSize.height * 2 + this.mapSize.width - 3) - 2 * (X * this.tileSize.height + Y * this.tileSize.width)) /
            (2 * this.tileSize.width * this.tileSize.height);
        r = utility.clamp(r, 0, this.mapSize.height - 1);
        let c =
            (2 * (X * this.tileSize.height - Y * this.tileSize.width) + this.tileSize.width * this.tileSize.height * (this.mapSize.width - 1)) /
            (2 * this.tileSize.width * this.tileSize.height);
        c = utility.clamp(c, 0, this.mapSize.width - 1);

        // console.log(`current row:${row}, col:${col}, X:${X}, Y:${Y}, K:${K}, isLeft:${isLeft}, r:${r}, c:${c}`);

        return { row: r, col: c };
    }

    calculateRowColByPolygon(location: cc.Vec2) {
        let pos = this.panelIndex.convertToNodeSpaceAR(location);
        for (let row = 0; row < this.mapSize.height; ++row) {
            for (let col = 0; col < this.mapSize.width; ++col) {
                let polygon = this.polygons[row * this.mapSize.width + col];
                if (cc.Intersection.pointInPolygon(pos, polygon)) {
                    return { row: row, col: col };
                }
            }
        }
        return { row: -1, col: -1 };
    }

    moveMainMap(delta: cc.Vec2) {
        let pos = this.panelMain.position.add(cc.v3(delta.x, delta.y));
        let maxDiffX = (this.panelMain.width * this.scale - cc.view.getVisibleSize().width) / 2;
        let maxDiffY = (this.panelMain.height * this.scale - cc.view.getVisibleSize().height) / 2;
        this.panelMain.x = utility.clamp(pos.x, -maxDiffX, maxDiffX);
        this.panelMain.y = utility.clamp(pos.y, -maxDiffY, maxDiffY);
    }

    onEditPath(event: cc.Event.EventTouch) {
        if (!this.curSelectRole) {
            return;
        }
        if (this.isEditPath && this.curNodePath.length > 2) {
            this.curSelectRole.position = this.curNodePath[0].position;
            let tween = new cc.Tween(this.curSelectRole);
            for (let index = 1; index < this.curNodePath.length; ++index) {
                let time = this.curNodePath[index].position.sub(this.curNodePath[index - 1].position).len() / 150;
                tween = tween.to(time, { x: this.curNodePath[index].x, y: this.curNodePath[index].y });
            }
            let time = this.curNodePath[this.curNodePath.length - 1].position.sub(this.curNodePath[0].position).len() / 150;
            tween.to(time, { x: this.curNodePath[0].x, y: this.curNodePath[0].y });
            tween.union().repeatForever().start();
            this.curSelectRole = null;
            this.curNodePath.forEach((node) => {
                node.destroy();
            });
            this.curNodePath = [];
        }
        this.isEditPath = !this.isEditPath;
        this.nodeFlag.active = this.isEditPath;
        event.stopPropagationImmediate();
    }

    onAdjustAnchorPoint(event: cc.Event.EventTouch) {
        if (!this.curSelectContent) {
            return;
        }
        this.panelAnchor.active = !this.panelAnchor.active;
        if (!this.panelAnchor.active) {
            this.panelAnchor.getChildByName('sprPreview')?.removeFromParent();
            return;
        }
        this.panelAnchor.getChildByName('editboxAnchorX').getComponent(cc.EditBox).string = this.curSelectContent.anchorX + '';
        this.panelAnchor.getChildByName('editboxAnchorY').getComponent(cc.EditBox).string = this.curSelectContent.anchorY + '';
        let node = cc.instantiate(this.curSelectContent);
        node.name = 'sprPreview';
        node.position = cc.v3(0, 0, 0);
        this.panelAnchor.addChild(node);
    }

    onEditAnchorX(editbox: cc.EditBox) {
        let anchorX = Number(editbox.string) != Number.NaN ? utility.clamp(Number(editbox.string), 0, 1) : 0.5;
        let spr = this.panelAnchor.getChildByName('sprPreview');
        spr.anchorX = anchorX;
        spr.x = 0;
        if (!this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name]) {
            this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name] = cc.v2(anchorX, spr.anchorY);
        } else {
            this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name].x = anchorX;
        }
        this.curSelectContent.setAnchorPoint(this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name]);
    }

    onEditAnchorY(editbox: cc.EditBox) {
        let anchorY = Number(editbox.string) != Number.NaN ? utility.clamp(Number(editbox.string), 0, 1) : 0.5;
        let spr = this.panelAnchor.getChildByName('sprPreview');
        spr.anchorY = anchorY;
        spr.y = 0;
        if (!this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name]) {
            this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name] = cc.v2(spr.anchorX, anchorY);
        } else {
            this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name].y = anchorY;
        }
        this.curSelectContent.setAnchorPoint(this.anchorPointCache[spr.getComponent(cc.Sprite).spriteFrame.name]);
    }
}

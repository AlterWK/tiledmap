class TopoSortNode {
    visitedFlag: boolean = false;
    currentNode: cc.Node = null;
    behindNodes: TopoSortNode[] = [];

    x: number = 0;
    y: number = 0;
    minX: number = 0;
    minY: number = 0;

    constructor(node: cc.Node) {
        this.currentNode = node;
        this.x = node.x;
        this.y = -node.y;
        this.minX = node.getBoundingBox().xMin;
        this.minY = -node.getBoundingBox().yMin;
    }
}

export class TopoLogicalSort {
    topoSortNodes: TopoSortNode[] = [];
    sortList: TopoSortNode[] = [];
    stack: any[] = [];

    wrapTopSortNode(node: cc.Node) {
        return new TopoSortNode(node);
    }

    buildNodeGraph(nodes: cc.Node[]) {
        for (let i = 0; i < nodes.length; ++i) {
            this.topoSortNodes.push(this.wrapTopSortNode(nodes[i]));
        }
        let first: TopoSortNode = null,
            second: TopoSortNode = null;
        for (let i = 0; i < this.topoSortNodes.length - 1; ++i) {
            first = this.topoSortNodes[i];
            for (let j = i + 1; j < this.topoSortNodes.length; ++j) {
                second = this.topoSortNodes[j];
                if (first.minX <= second.x && first.minY <= second.y) {
                    second.behindNodes.push(first);
                } else if (second.minX <= first.x && second.minY <= first.y) {
                    first.behindNodes.push(second);
                }
            }
        }
    }

    visitNode(object: TopoSortNode) {
        const stack = this.stack;
        let startVisit = false;
        let start = 0;
        let count = object.behindNodes.length;
        while (true) {
            let temp: TopoSortNode = null;
            for (let i = start; i < count; ++i) {
                temp = object.behindNodes[i];
                if (!temp.visitedFlag) {
                    temp.visitedFlag = true;
                    stack.push(i, count, object);
                    startVisit = true;
                    break;
                }
            }

            if (startVisit) {
                object = temp;
                count = object.behindNodes.length;
                start = 0;
                startVisit = false;
                continue;
            }

            this.sortList.push(object);

            if (stack.length === 0) {
                break;
            }

            object = stack.pop();
            count = stack.pop();
            start = stack.pop();
        }
    }

    sort(nodes: cc.Node[]) {
        this.buildNodeGraph(nodes);

        for (let i = 0; i < this.topoSortNodes.length; ++i) {
            const obj = this.topoSortNodes[i];
            if (!obj.visitedFlag) {
                obj.visitedFlag = true;
                this.visitNode(obj);
            }
        }
    }
}

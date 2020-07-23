import { TEXT, PLACEMENT, UPDATE } from './const';

// 下一个任务fiber
let nextUnitOfWork = null;

// work in progress fiber root
let wipRoot = null;

// 当前的根fiber root
let currentRoot = null;

// fiber 结构

//** child sibling return node dom节点  base存储当前节点的上一次的fiber节点*/

function render(vnode, container) {
    wipRoot = {
        node: container,
        props: {
            children: [vnode]
        },
        base: currentRoot,
    };
    console.log("wipeRoot", wipRoot);
    nextUnitOfWork = wipRoot;
}

function createNode(fiber) {
    const { type, props} = fiber;
    let node = null;
    if(type === TEXT) {
        node = document.createTextNode("");
    } else if (typeof type === "string") {
        node = document.createElement(type);
    }
    // else {
    //     node = document.createDocumentFragment();
    // }
    updateNode(node, {}, props);
    return node;
}

function updateNode(node, prevVal,nextVal) {
    // 旧的 className：red style: {{ color: 'red}}
    //新的 style: {{color: 'pink'}}
    Object.keys(prevVal)
    .filter(k => k !== "children")
    .forEach(k => {
        if(k.slice(0,2) === "on") {
            let eventName = k.slice(2).toLowerCase();
            node.removeEventListener(eventName, prevVal[k]);
        } else {
            // 简单处理，如果需要考虑style的话，需要再做处理
            if(! (k in nextVal)) {
                node[k] = "";
            }
            // node[k] = nextVal[k];
        }
    });

    Object.keys(nextVal)
    .filter(k => k !== "children")
    .forEach(k => {
        if(k.slice(0, 2) === "on") {
            let eventName = k.slice(2).toLowerCase();
            node.addEventListener(eventName, nextVal[k]);
        } else {
            node[k] = nextVal[k];
        }
    });
}


function reconcileChildren(workInProgressFiber, children) {
    let oldFiber = workInProgressFiber.base && workInProgressFiber.base.child;
    let prevSibling = null;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        let newFiber = null;
        const sameType = child && oldFiber && child.type === oldFiber.type;
        if(sameType) {
            // 类型相同 复用
            newFiber = {
                type: child.type,
                props: child.props,
                node: oldFiber.node,
                base: oldFiber,  // 存储当前节点上一次的值
                return: workInProgressFiber,
                effectTag: UPDATE,
            };
        }
        
        if(!sameType && child) {
            // 类型不同 child存在，新增插入
            newFiber = {
                type: child.type,
                props: child.props,
                node: null,
                base: null,
                return: workInProgressFiber,
                effectTag: PLACEMENT,
            };
        }

        if(!sameType && oldFiber) {
            // 类型不同 child存在，新增插入
        }

        if(oldFiber) {
            oldFiber.sibling = newFiber;
        }

        if(i === 0) {
            workInProgressFiber.child = newFiber;
        } else {
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
    }
    
}

function updateHostComponent(fiber) {
    if(!fiber.node) {
        fiber.node = createNode(fiber);
    }

    const { children } = fiber.props;
    reconcileChildren(fiber, children);
    
}

function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    wipFiber.hooks = [];
    hookIndex = 0;
    const { type, props } = fiber;
    const children = [type(props)];
    reconcileChildren(fiber, children);
    
}

function updateClassComponent(fiber) {
    const { type, props } = fiber;
    const cmp = new type(props);
    const children = [cmp.render()];
    reconcileChildren(fiber,children);
    
}

function performUnitOfWork(fiber) {
    // 1. 执行当前任务
    const { type }= fiber;
    if(typeof type === "function") {
        type.isReactComponent
        ? updateClassComponent(fiber)
        : updateFunctionComponent(fiber);

    } else {
        // 原生标签
        updateHostComponent(fiber);
    }
    


    // 2. 返回下一个任务
    // 找到下一个任务， 得有原则， 原则就是先找子元素
    if(fiber.child) {
      return fiber.child
    }

    //原则2:如果没有子元素，寻找兄弟元素
    let nextFiber = fiber;
    while (nextFiber) {
        if(nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.return;
    }
    
}

function workLoop(deadline) {
    // 查找下一个任务，并且当前帧没有结束
    while (nextUnitOfWork && deadline.timeRemaining() > 1) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }

    //所有任务执行完成
    // todo commit
    if(!nextUnitOfWork && wipRoot) {
        commitRoot();
    }

    requestIdleCallback(workLoop);
    
}

requestIdleCallback(workLoop);

// commit 阶段
function commitRoot() {
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }

    // parentNodeFiber指的是当前fiber的有node节点的父fiber或者祖先
    let parentNodeFiber = fiber.return;
    while(!parentNodeFiber.node) {
        parentNodeFiber = parentNodeFiber.return;
    }


    // parentNode 是指fiber的父node(当前fiber的父fiber可能没有node么)
    const parentNode = parentNodeFiber.node;
    if(fiber.effectTag === PLACEMENT && fiber.node !== null) {
        parentNode.appendChild(fiber.node);
    } else if(fiber.effectTag === UPDATE && fiber.node !== null) {
        // 更新
        updateNode(fiber.node, fiber.base.props, fiber.props);

    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
    
}


// 当前正在工作中的fiber，work in progress
let wipFiber = null;
let hookIndex = null;

export function useState(init) {
    // 状态值：初始值以及改变之后的值
    // 
    const oldHook = wipFiber.base && wipFiber.base.hooks[hookIndex];
    const hook = { state: oldHook ? oldHook.state : init, queue: []};

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => (hook.state = action));

    const setState = action => {
        hook.queue.push(action);
        wipRoot = {
            node: currentRoot.node,
            props: currentRoot.props,
            base: currentRoot

        };

        nextUnitOfWork = wipRoot;
        console.log("action", action);
    };
    // [状态值，改变状态值的函数]
    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state ,setState]
}

export default {
    render,
}
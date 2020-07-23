// import React, { Component, useState } from 'react';
// import ReactDOM from 'react-dom';

import React from './kreact/';
import ReactDOM, {useState} from './kreact/react-dom-fiber';
import Component from './kreact/Component';
import './index.css';

class ClassComponent extends Component {
  static defaultProps ={
    color: "pink"
  };
  render() {
    return (
      <div className="border">
        <div style={{color: this.props.color}}>color</div>
        {this.props.name}
      </div>
    )
  }
}

function FunctionComponent({name}) {
  const [state, setstate] = useState(0);
  return <div className="border">
    {name}
    <button onClick={() => {setstate(state + 1); setstate(state + 2);}}>{state}:click add</button>
    <button onClick={()=> console.log('click btn')}>btn</button>
    </div>
}

const jsx = (
    <div className="border">
      <p>react学习</p>
      <a href="https://baidu.com">react源码</a>
      <FunctionComponent name="我是一个function组件" />
      <ClassComponent name="我是一个class组件" color = 'green' />

      <>
        <h1>文本1</h1>
        <h2>文本2</h2>
      </>
    </div>
  );

// vnode->node,把node装入container
ReactDOM.render(
  jsx,
  document.getElementById('root')
);

console.log(React.version);

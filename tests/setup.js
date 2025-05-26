/**
 * Jest セットアップファイル
 * テスト実行前の環境準備
 */

// WebGL のモック
global.WebGLRenderingContext = jest.fn();
global.WebGL2RenderingContext = jest.fn();

// Performance API のモック
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 10000000,
    jsHeapSizeLimit: 100000000
  }
};

// RequestAnimationFrame のモック
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Canvas API のモック
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Array(4) })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      clip: jest.fn(),
      font: '16px Arial',
      textAlign: 'left',
      textBaseline: 'top',
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      canvas: {
        width: 800,
        height: 600
      }
    };
  }
  
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return {
      // WebGL API の基本的なモック
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      useProgram: jest.fn(),
      createBuffer: jest.fn(() => ({})),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      createTexture: jest.fn(() => ({})),
      bindTexture: jest.fn(),
      texImage2D: jest.fn(),
      texParameteri: jest.fn(),
      generateMipmap: jest.fn(),
      createFramebuffer: jest.fn(() => ({})),
      bindFramebuffer: jest.fn(),
      framebufferTexture2D: jest.fn(),
      createRenderbuffer: jest.fn(() => ({})),
      bindRenderbuffer: jest.fn(),
      renderbufferStorage: jest.fn(),
      framebufferRenderbuffer: jest.fn(),
      viewport: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
      clearDepth: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      depthFunc: jest.fn(),
      blendFunc: jest.fn(),
      drawArrays: jest.fn(),
      drawElements: jest.fn(),
      getAttribLocation: jest.fn(() => 0),
      getUniformLocation: jest.fn(() => ({})),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      uniform1f: jest.fn(),
      uniform1i: jest.fn(),
      uniform2f: jest.fn(),
      uniform3f: jest.fn(),
      uniform4f: jest.fn(),
      uniformMatrix4fv: jest.fn(),
      getExtension: jest.fn(() => null),
      getSupportedExtensions: jest.fn(() => []),
      getParameter: jest.fn(() => 4096),
      canvas: {
        width: 800,
        height: 600
      },
      // WebGL 定数
      VERTEX_SHADER: 35633,
      FRAGMENT_SHADER: 35632,
      COMPILE_STATUS: 35713,
      LINK_STATUS: 35714,
      ARRAY_BUFFER: 34962,
      ELEMENT_ARRAY_BUFFER: 34963,
      STATIC_DRAW: 35044,
      TEXTURE_2D: 3553,
      RGBA: 6408,
      UNSIGNED_BYTE: 5121,
      TEXTURE_MAG_FILTER: 10240,
      TEXTURE_MIN_FILTER: 10241,
      LINEAR: 9729,
      REPEAT: 10497,
      CLAMP_TO_EDGE: 33071,
      TEXTURE_WRAP_S: 10242,
      TEXTURE_WRAP_T: 10243,
      COLOR_BUFFER_BIT: 16384,
      DEPTH_BUFFER_BIT: 256,
      DEPTH_TEST: 2929,
      BLEND: 3042,
      SRC_ALPHA: 770,
      ONE_MINUS_SRC_ALPHA: 771,
      TRIANGLES: 4,
      FLOAT: 5126,
      FALSE: 0,
      TRUE: 1
    };
  }
  
  return null;
});

// DOM API の拡張
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  get() { return parseInt(this.style.width) || 800; }
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  get() { return parseInt(this.style.height) || 600; }
});

// カスタムマッチャーの追加
expect.extend({
  toBeValidThreeJSObject(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.type !== undefined;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Three.js object`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Three.js object`,
        pass: false,
      };
    }
  },
});

// テスト環境のログレベル設定
console.log('Test environment setup completed');
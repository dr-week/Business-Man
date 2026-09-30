// WebGPUHeatmap.tsx – Experimental component rendering a heatmap using WebGPU
// This component demonstrates how to use WebGPU (via the browser) to draw a simple heatmap
// of market‑research data (e.g., GDP per state). It is purely experimental and meant for
// performance testing and visual flair. The component is self‑contained and does not
// depend on external state. It expects a "data" prop – an array of numbers representing
// values for a grid (e.g., 10x10).

import React, { useRef, useEffect } from "react";

interface WebGPUHeatmapProps {
  /** Flat array of values; length must be a perfect square (e.g., 100 for a 10×10 grid) */
  data: number[];
  /** Width and height of the canvas in CSS pixels */
  size?: number;
}

const WebGPUHeatmap: React.FC<WebGPUHeatmapProps> = ({ data, size = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Utility: map a value (0‑1) to an RGB color (blue‑to‑red)
  const valueToColor = (v: number) => {
    const r = Math.round(255 * v);
    const b = Math.round(255 * (1 - v));
    return [r / 255, 0, b / 255, 1]; // RGBA normalized
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!navigator.gpu) {
      console.warn("WebGPU not supported in this browser");
      return;
    }

    const init = async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error("Failed to get GPU adapter");
        return;
      }
      const device = await adapter.requestDevice();
      const context = canvasRef.current!.getContext("webgpu") as unknown as GPUCanvasContext;

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "premultiplied" });

      const gridSize = Math.sqrt(data.length);
      if (!Number.isInteger(gridSize)) {
        console.error("Data length must be a perfect square");
        return;
      }

      // Create a texture to store the heatmap colors
      const texture = device.createTexture({
        size: [gridSize, gridSize, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });

      // Convert data values (assumed 0‑1) to RGBA bytes
      const rgbaData = new Uint8Array(gridSize * gridSize * 4);
      data.forEach((val, i) => {
        const [r, g, b, a] = valueToColor(val);
        const base = i * 4;
        rgbaData[base] = Math.round(r * 255);
        rgbaData[base + 1] = Math.round(g * 255);
        rgbaData[base + 2] = Math.round(b * 255);
        rgbaData[base + 3] = Math.round(a * 255);
      });

      // Upload to the texture
      device.queue.writeTexture(
        { texture },
        rgbaData,
        { bytesPerRow: gridSize * 4 },
        [gridSize, gridSize, 1]
      );

      // Simple shader that samples the texture and outputs the color
      const shaderModule = device.createShaderModule({
        code: `
          @group(0) @binding(0) var myTexture: texture_2d<f32>;
          @group(0) @binding(1) var mySampler: sampler;
          @vertex
          fn vs(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
            var pos = array<vec2<f32>, 6>(
              vec2<f32>(-1.0, -1.0),
              vec2<f32>( 1.0, -1.0),
              vec2<f32>(-1.0,  1.0),
              vec2<f32>(-1.0,  1.0),
              vec2<f32>( 1.0, -1.0),
              vec2<f32>( 1.0,  1.0)
            );
            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
          }
          @fragment
          fn fs(@builtin(position) FragCoord : vec4<f32>) -> @location(0) vec4<f32> {
            let texSize = textureDimensions(myTexture);
            let uv = FragCoord.xy / vec2<f32>(texSize);
            return textureSample(myTexture, mySampler, uv);
          }
        `,
      });

      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: shaderModule, entryPoint: "vs" },
        fragment: { module: shaderModule, entryPoint: "fs", targets: [{ format }] },
      });

      const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: texture.createView() },
          { binding: 1, resource: sampler },
        ],
      });

      const render = () => {
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();
        const pass = commandEncoder.beginRenderPass({
          colorAttachments: [{ view: textureView, loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();
        device.queue.submit([commandEncoder.finish()]);
      };

      render();
    };
    init();
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, border: "1px solid #ddd" }}
    />
  );
};

export default WebGPUHeatmap;

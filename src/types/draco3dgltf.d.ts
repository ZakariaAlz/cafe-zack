declare module "draco3dgltf" {
  type DracoModule = unknown;
  const draco3d: {
    createDecoderModule(config?: Record<string, unknown>): Promise<DracoModule>;
    createEncoderModule(config?: Record<string, unknown>): Promise<DracoModule>;
  };
  export default draco3d;
}

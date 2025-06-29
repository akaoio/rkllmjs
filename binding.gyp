{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/bindings/binding.cpp",
        "src/bindings/llm-handle/llm-handle.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "libs/rkllm/include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["target_arch=='arm64'", {
          "libraries": [
            "-lrkllmrt",
            "-L<(module_root_dir)/libs/rkllm/aarch64"
          ],
          "defines": [ "RKLLM_NATIVE_AVAILABLE" ],
          "cflags_cc": [
            "-std=c++17",
            "-fPIC"
          ],
          "ldflags": [
            "-Wl,-rpath,<(module_root_dir)/libs/rkllm/aarch64"
          ]
        }],
        ["target_arch!='arm64'", {
          "defines": [ "RKLLM_STUB_ONLY" ],
          "cflags_cc": [
            "-std=c++17",
            "-fPIC"
          ]
        }],
        ["OS=='linux'", {
          "cflags": ["-fPIC"]
        }]
      ]
    }
  ]
}
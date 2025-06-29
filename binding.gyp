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
      "libraries": [
        "<(module_root_dir)/libs/rkllm/aarch64/librkllmrt.so"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        ["OS=='linux'", {
          "cflags": ["-fPIC"],
          "ldflags": [
            "-Wl,-rpath,<(module_root_dir)/libs/rkllm/aarch64"
          ]
        }]
      ]
    }
  ]
}
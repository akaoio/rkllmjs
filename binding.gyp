{
  "targets": [
    {
      "target_name": "rkllmjs",
      "sources": [
        "src/native/rkllm_addon.cpp",
        "src/native/rkllm_wrapper.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "libs/rkllm/include"
      ],
      "libraries": [
        "-L<(module_root_dir)/libs/rkllm/aarch64",
        "-L<(module_root_dir)/libs/rkllm/armhf", 
        "-lrkllmrt"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        [
          "target_arch=='arm64'",
          {
            "library_dirs": ["<(module_root_dir)/libs/rkllm/aarch64"]
          }
        ],
        [
          "target_arch=='arm'",
          {
            "library_dirs": ["<(module_root_dir)/libs/rkllm/armhf"]
          }
        ]
      ]
    }
  ]
}

{
  "targets": [
    {
      "target_name": "binding",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "src/native/binding.cc",
        "src/native/rkllm-wrapper.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "libs/rkllm/include"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
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
          ]
        }],
        ["target_arch!='arm64'", {
          "defines": [ "RKLLM_STUB_ONLY" ],
          "cflags_cc": [
            "-std=c++17",
            "-fPIC"
          ]
        }]
      ]
    }
  ]
}
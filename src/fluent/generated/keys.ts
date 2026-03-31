import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '8ab320925dfd4db5ad95f9bd8a11ba5f'
                    }
                    br0: {
                        table: 'sys_script'
                        id: '5828c7eb9edf45259eeb47da5cb85eef'
                    }
                    cs0: {
                        table: 'sys_script_client'
                        id: '1b5366b4bc014aa886772ae6829983e4'
                    }
                    'license-center-page': {
                        table: 'sys_ui_page'
                        id: '85d6e977bf42471a9a5c42755750a736'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '8471f8d49b144dd08631fa08645ba3d1'
                    }
                    src_server_script_ts: {
                        table: 'sys_module'
                        id: '388e15bdafe4444095036b906938819b'
                    }
                    'src_server_script-includes_license-data-api_js': {
                        table: 'sys_module'
                        id: '8cb495179a034d319925cb2330f46963'
                    }
                    'x_1917927_hello_wo/main': {
                        table: 'sys_ux_lib_asset'
                        id: '6628da95c8f94238a74a3a9fd9cb2fda'
                    }
                    'x_1917927_hello_wo/main.js.map': {
                        table: 'sys_ux_lib_asset'
                        id: '970e1b10121f4e549094d1c03e755b2d'
                    }
                }
            }
        }
    }
}

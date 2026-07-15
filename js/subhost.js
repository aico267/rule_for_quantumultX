/**
 * @Sub-Store-Page
 * 混淆转换（XHTTP download-settings 修复版）
 *
 * - 支持修改 `host` 混淆、`path` 路径、`port` 端口、`method` 请求方式
 * - 兼容 VMess、VLESS 的 ws、h2、http、xhttp 和其他传输
 * - 兼容 VLESS Reality 的 servername
 * - 兼容 Snell obfs 的 host
 * - 兼容 Shadow TLS 的 shadow-tls-sni/plugin-opts.host
 * - 兼容 Trojan、AnyTLS 的 SNI
 *
 * XHTTP 支持同步修改：
 * - 顶层 servername、sni、skip-cert-verify
 * - xhttp-opts.host
 * - xhttp-opts.headers.Host
 * - xhttp-opts.download-settings.host
 * - xhttp-opts.download-settings.headers.Host
 * - xhttp-opts.download-settings.servername
 * - xhttp-opts.download-settings.skip-cert-verify
 * - xhttp-opts.download-settings.path
 * - xhttp-opts.download-settings.port
 *
 * - 兼容 QuanX、Surge、Loon、Shadowrocket、Stash、Clash/Mihomo
 *   和 Node.js 环境
 *
 * ⚠️ 不能使用指定 Host/SNI 的节点，请先自行筛选掉。
 */

const SUB_STORE_SCHEMA = {
  title: '混淆转换',
  description:
    '支持修改 Host、Path、Port、Method，并完整处理 XHTTP download-settings',
  scope: [
    'Node',
    'Surge',
    'QX',
    'Loon',
    'Stash',
    'ShadowRocket',
    'Clash',
  ],
  author: '@xream（XHTTP 修复版）',
  updateTime: '2026-07-14 20:00:00',
  version: '1.0.5-xhttp-fix',
  params: {
    host: {
      name: '混淆',
      dataType: 'string',
      description:
        '修改 Host、TLS SNI，以及 XHTTP 上下行的 Host 和 ServerName',
      placeholder: '如：www.dingtalk.com',
    },
    hostPrefix: {
      name: '节点名混淆前缀',
      dataType: 'string',
      description: '为修改了 Host 的节点名添加前缀',
    },
    hostSuffix: {
      name: '节点名混淆后缀',
      dataType: 'string',
      description: '为修改了 Host 的节点名添加后缀',
    },
    path: {
      name: '路径',
      dataType: 'string',
      description:
        '修改 Path；XHTTP 存在 download-settings 时同步修改下行路径',
    },
    pathPrefix: {
      name: '节点名路径前缀',
      dataType: 'string',
      description: '为修改了 Path 的节点名添加前缀',
    },
    pathSuffix: {
      name: '节点名路径后缀',
      dataType: 'string',
      description: '为修改了 Path 的节点名添加后缀',
    },
    port: {
      name: '端口',
      dataType: 'number',
      description:
        '修改 Port；XHTTP 存在 download-settings 时同步修改下行端口',
      placeholder: '如：443',
    },
    portPrefix: {
      name: '节点名端口前缀',
      dataType: 'string',
      description: '为修改了 Port 的节点名添加前缀',
    },
    portSuffix: {
      name: '节点名端口后缀',
      dataType: 'string',
      description: '为修改了 Port 的节点名添加后缀',
    },
    method: {
      name: '请求方式',
      dataType: 'string',
      description: '修改 Method，例如传输层为 HTTP 时',
    },
    defaultMethod: {
      name: '默认请求方式',
      dataType: 'string',
      description:
        '默认 method；HTTP 节点没有 method 时设置为此值',
      defaultValue: 'GET',
    },
    defaultNetwork: {
      name: '默认传输方式',
      dataType: 'string',
      description:
        '默认 network；符合条件的节点没有 network 时设置为此值',
      defaultValue: 'http',
    },
    defaultPath: {
      name: '默认路径',
      dataType: 'string',
      description:
        '默认 path；HTTP 节点没有有效 path 时设置为此值',
      defaultValue: '/',
    },
    array: {
      name: '输出字段数组',
      dataType: 'boolean',
      description:
        '是否把 http/h2 的 host、path 设置为数组；旧版 Sub-Store 后端输出 Clash 系格式时可能需要',
    },
  },
}

function operator(proxies = []) {
  const _ = lodash

  return proxies.map((p = {}) => {
    /*
     * 读取脚本参数
     */
    const host = _.get($arguments, 'host')
    const hostPrefix = _.get($arguments, 'hostPrefix')
    const hostSuffix = _.get($arguments, 'hostSuffix')

    const port = _.get($arguments, 'port')
    const portPrefix = _.get($arguments, 'portPrefix')
    const portSuffix = _.get($arguments, 'portSuffix')

    const defaultPath =
      _.get($arguments, 'defaultPath') ??
      SUB_STORE_SCHEMA.params.defaultPath.defaultValue

    let path = _.get($arguments, 'path')
    const pathPrefix = _.get($arguments, 'pathPrefix')
    const pathSuffix = _.get($arguments, 'pathSuffix')

    const defaultMethod =
      _.get($arguments, 'defaultMethod') ??
      SUB_STORE_SCHEMA.params.defaultMethod.defaultValue

    const method = _.get($arguments, 'method')
    const array = _.get($arguments, 'array')

    const defaultNetwork =
      _.get($arguments, 'defaultNetwork') ??
      SUB_STORE_SCHEMA.params.defaultNetwork.defaultValue

    /*
     * 读取节点信息
     */
    let network = _.get(p, 'network')
    const type = _.get(p, 'type')

    const isReality = Boolean(_.get(p, 'reality-opts'))
    const isSnell = type === 'snell'
    const isTrojan = type === 'trojan'
    const isAnyTLS = type === 'anytls'

    const isShadowTLSPlugin =
      _.get(p, 'plugin') === 'shadow-tls'

    const isShadowTLS =
      isShadowTLSPlugin ||
      _.chain(p)
        .get('shadow-tls-password')
        .size()
        .value() > 0

    /*
     * 只处理原脚本支持的节点类型
     */
    if (
      !_.includes(
        ['vmess', 'vless', 'snell', 'trojan', 'anytls'],
        type,
      )
    ) {
      return p
    }

    /*
     * 设置默认传输方式
     */
    if (
      !network &&
      !isReality &&
      !isSnell &&
      !isShadowTLS &&
      !isTrojan &&
      !isAnyTLS
    ) {
      network = defaultNetwork
      _.set(p, 'network', defaultNetwork)
    }

    const isXHTTP = network === 'xhttp'
    const downloadSettingsPath =
      'xhttp-opts.download-settings'

    /*
     * 只有原节点已经存在 download-settings 时，
     * 才修改其中的配置，不主动创建独立下行。
     */
    const hasXHTTPDownloadSettings =
      isXHTTP &&
      _.has(p, downloadSettingsPath) &&
      _.get(p, downloadSettingsPath) !== null

    /*
     * 修改 Host、SNI、ServerName
     */
    if (host) {
      /*
       * 修改节点名称
       */
      if (hostPrefix) {
        _.set(
          p,
          'name',
          `${hostPrefix}${_.get(p, 'name', '')}`,
        )
      }

      if (hostSuffix) {
        _.set(
          p,
          'name',
          `${_.get(p, 'name', '')}${hostSuffix}`,
        )
      }

      /*
       * Shadow TLS
       */
      if (isShadowTLS) {
        if (isShadowTLSPlugin) {
          _.set(p, 'plugin-opts.host', host)
        } else {
          _.set(p, 'shadow-tls-sni', host)
        }
      } else if (isSnell) {
        /*
         * Snell obfs Host
         */
        _.set(p, 'obfs-opts.host', host)

        /*
         * 保留原脚本的 Snell v5 降级行为
         */
        if (_.get(p, 'version') === 5) {
          _.set(p, 'version', 4)
        }
      } else if (isAnyTLS) {
        /*
         * AnyTLS SNI
         */
        _.set(p, 'sni', host)
      } else {
        /*
         * VMess、VLESS、Trojan 顶层 ServerName
         */
        _.set(p, 'servername', host)

        /*
         * TLS 节点同步修改 SNI，并跳过证书验证
         */
        if (_.get(p, 'tls')) {
          _.set(p, 'sni', host)
          _.set(p, 'skip-cert-verify', true)
        }
      }

      /*
       * 修改各传输层的 Host
       */
      if (!isSnell && !isShadowTLS && !isAnyTLS) {
        if (isXHTTP) {
          /*
           * XHTTP 上行 Host/:authority
           */
          _.set(p, 'xhttp-opts.host', host)

          /*
           * 同时修改普通 Host Header
           */
          _.set(
            p,
            'xhttp-opts.headers.Host',
            host,
          )

          /*
           * XHTTP 独立下行配置
           */
          if (hasXHTTPDownloadSettings) {
            /*
             * 下行 HTTP Host/:authority
             */
            _.set(
              p,
              `${downloadSettingsPath}.host`,
              host,
            )

            /*
             * 下行普通 Host Header
             */
            _.set(
              p,
              `${downloadSettingsPath}.headers.Host`,
              host,
            )

            /*
             * 下行 TLS SNI/ServerName
             */
            _.set(
              p,
              `${downloadSettingsPath}.servername`,
              host,
            )

            /*
             * 判断下行是否使用 TLS。
             *
             * download-settings.tls 已填写：
             * 使用下行自己的值。
             *
             * download-settings.tls 未填写：
             * 继承顶层 tls。
             */
            const downloadTLS = _.has(
              p,
              `${downloadSettingsPath}.tls`,
            )
              ? _.get(
                  p,
                  `${downloadSettingsPath}.tls`,
                )
              : _.get(p, 'tls')

            /*
             * 修改下行 SNI 后同步跳过证书验证
             */
            if (downloadTLS) {
              _.set(
                p,
                `${downloadSettingsPath}.skip-cert-verify`,
                true,
              )
            }
          }
        } else if (!isReality) {
          /*
           * WebSocket
           */
          if (network === 'ws') {
            _.set(
              p,
              'ws-opts.headers.Host',
              host,
            )
          } else if (network === 'h2') {
            /*
             * HTTP/2
             */
            _.set(
              p,
              'h2-opts.host',
              array ? [host] : host,
            )
          } else if (network === 'http') {
            /*
             * HTTP
             */
            _.set(
              p,
              'http-opts.headers.Host',
              array ? [host] : host,
            )
          } else if (network) {
            /*
             * 其他传输暂按字符串写入
             */
            _.set(
              p,
              `${network}-opts.headers.Host`,
              host,
            )
          }
        }
      }
    }

    /*
     * 修改 HTTP Method
     *
     * 优先级：
     * 1. 用户填写的 method
     * 2. 节点原来的 method
     * 3. defaultMethod
     */
    if (network === 'http') {
      const currentMethod = _.get(
        p,
        'http-opts.method',
      )

      const finalMethod =
        method || currentMethod || defaultMethod

      _.set(
        p,
        'http-opts.method',
        finalMethod,
      )
    }

    /*
     * 修改端口
     */
    if (port) {
      /*
       * 主连接/上行端口
       */
      _.set(p, 'port', port)

      /*
       * XHTTP 独立下行端口
       */
      if (hasXHTTPDownloadSettings) {
        _.set(
          p,
          `${downloadSettingsPath}.port`,
          port,
        )
      }

      if (portPrefix) {
        _.set(
          p,
          'name',
          `${portPrefix}${_.get(p, 'name', '')}`,
        )
      }

      if (portSuffix) {
        _.set(
          p,
          'name',
          `${_.get(p, 'name', '')}${portSuffix}`,
        )
      }
    }

    /*
     * 处理 HTTP 默认路径
     *
     * 用户没有填写 path 时，保留节点现有有效路径；
     * 节点也没有有效路径时，使用 defaultPath。
     */
    if (network === 'http' && !path) {
      let currentPath = _.get(
        p,
        'http-opts.path',
      )

      if (_.isArray(currentPath)) {
        currentPath = _.find(
          currentPath,
          item =>
            _.isString(item) &&
            _.startsWith(item, '/'),
        )
      }

      if (
        _.isString(currentPath) &&
        _.startsWith(currentPath, '/')
      ) {
        path = currentPath
      } else {
        path = defaultPath
      }
    }

    /*
     * 修改传输路径
     *
     * XHTTP 即使同时使用 Reality，也允许修改 xhttp-opts.path。
     */
    if (
      path &&
      (!isReality || isXHTTP) &&
      !isSnell &&
      !isShadowTLS &&
      !isAnyTLS
    ) {
      if (pathPrefix) {
        _.set(
          p,
          'name',
          `${pathPrefix}${_.get(p, 'name', '')}`,
        )
      }

      if (pathSuffix) {
        _.set(
          p,
          'name',
          `${_.get(p, 'name', '')}${pathSuffix}`,
        )
      }

      if (network === 'ws') {
        _.set(p, 'ws-opts.path', path)
      } else if (network === 'h2') {
        _.set(p, 'h2-opts.path', path)
      } else if (network === 'http') {
        _.set(
          p,
          'http-opts.path',
          array ? [path] : path,
        )
      } else if (isXHTTP) {
        /*
         * XHTTP 上行路径
         */
        _.set(p, 'xhttp-opts.path', path)

        /*
         * XHTTP 独立下行路径
         */
        if (hasXHTTPDownloadSettings) {
          _.set(
            p,
            `${downloadSettingsPath}.path`,
            path,
          )
        }
      } else if (network) {
        /*
         * 其他传输暂按字符串写入
         */
        _.set(
          p,
          `${network}-opts.path`,
          path,
        )
      }
    }

    return p
  })
}

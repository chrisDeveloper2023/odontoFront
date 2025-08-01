import { Injectable, Compiler } from "@angular/core";
import {
  Headers,
  Http,
  Response,
  RequestOptions,
  URLSearchParams,
} from "@angular/http";
import { Observable } from "rxjs/Rx";
import { JwtHelper, AuthHttp, AuthHttpError } from "angular2-jwt";
import { Usuario, Permiso } from "./usuario";
import { ConstantService } from "../utils/constant.service";
import { CustomQueryEncoderHelper } from "../utils/helpers";

@Injectable()
export class AuthService {
  private authUrl = "seguridad/loginArmonix";
  private logoutUrl = "seguridad/logoutArmonix";
  public token: any;
  jwtHelper: JwtHelper = new JwtHelper();
  public nombreCompleto: string;
  public nombreUsuario: string;
  public tipoPermiso: string;
  public clientId: string;
  public numeroNotificaciones: number;
  public contentType = "application/x-www-form-urlencoded";
  private readonly desbloqueoCorreoUrl: string = "seguridad/EnvioCorreoDesbloqueo/" ;
  private readonly desbloqueoUrl: string = "seguridad/DesbloqueoUsuario/";
  private readonly noDesbloqueoUrl: string = "seguridad/NoDesbloqueo/";

  constructor(
    private http: Http,
    private compiler: Compiler,
    private authHttp: AuthHttp,
    private constantService: ConstantService
  ) {
    this.authUrl = constantService.API_ENDPOINT + this.authUrl;
    this.logoutUrl = constantService.API_ENDPOINT + this.logoutUrl;
    this.clientId = constantService.CLIENT_ID;
    let userData = localStorage.getItem("user_data");
    this.numeroNotificaciones = 0;
    this.cargarDatosUsuario(userData);
    this.desbloqueoCorreoUrl = constantService.API_ENDPOINT + this.desbloqueoCorreoUrl;
    this.desbloqueoUrl = constantService.API_ENDPOINT + this.desbloqueoUrl;
    this.noDesbloqueoUrl = constantService.API_ENDPOINT + this.noDesbloqueoUrl;
  }

  controlTime() {
    const token = localStorage.getItem("id_token");
    const tokenDecode = this.jwtHelper.decodeToken(token);
    return new Date(tokenDecode.exp * 1000).getTime() - new Date().getTime();
  }

  login(usuario: Usuario): Observable<any> {
    const urlSearchParams = new URLSearchParams(
      "",
      new CustomQueryEncoderHelper()
    );
    urlSearchParams.append("grant_type", "password");
    urlSearchParams.append("client_id", this.clientId.toString());
    urlSearchParams.append("username", usuario.NombreUsuario.toString());
    urlSearchParams.append("password", usuario.Contrasenia.toString());
    return Observable.create((observe) => {
      this.currentIpPublica().then(() => {
        const headers = new Headers({
          "Content-Type": this.contentType,
          DireccionIP: localStorage.getItem("ip_publica"),
          DispositivoNavegador: this.navegador(),
          SistemaOperativo: this.sistemaOperativo(),
        });
        const options = new RequestOptions({ headers: headers });
        localStorage.setItem("username", usuario.NombreUsuario.toString());

        this.http
          .post(this.authUrl, urlSearchParams, options)
          .map((response: Response) => {
            // login successful if there's a jwt token in the response
            const tokenResponse = response.json();
            if (tokenResponse != null && tokenResponse.access_token) {
              // set token property
              this.token = tokenResponse.access_token;
              // store username and jwt token in local storage to keep user logged in between page refreshes
              localStorage.setItem("id_token", this.token);
              // store the refresh token for future authorize access
              const refreshToken = response.json().refresh_token;
              if (refreshToken != null) {
                localStorage.setItem("refresh_token", refreshToken);
              }

              const userData = response.json().user_data;
              if (userData != null) {
                localStorage.setItem("user_data", userData);
                this.cargarDatosUsuario(userData);
                this.ipPublica();
              }

              // return true to indicate successful login
              return { status: true };
            } else {
              // return false to indicate failed login
              return { status: false, message: tokenResponse };
            }
          })
          .catch(this.handleError)
          .subscribe(
            (response) => {
              observe.next(response);
              observe.complete();
            },
            (error) => {
              observe.error(error);
              observe.complete();
            }
          );
      });
    });
  }

  refreshToken(): Observable<boolean> {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append("grant_type", "refresh_token");
    urlSearchParams.append("client_id", this.clientId.toString());
    urlSearchParams.append(
      "refresh_token",
      localStorage.getItem("refresh_token")
    );

    let headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    let options = new RequestOptions({ headers: headers });

    return this.http
      .post(this.authUrl, urlSearchParams, options)
      .map((response: Response) => {
        // login successful if there's a jwt token in the response
        let tokenResponse = response.json();
        if (tokenResponse != null && tokenResponse.access_token) {
          // set token property
          this.token = tokenResponse.access_token;
          // store username and jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem("id_token", this.token);
          // store the refresh token for future authorize access
          let refreshToken = response.json().refresh_token;
          if (refreshToken != null) {
            localStorage.setItem("refresh_token", refreshToken);
          }

          let userData = response.json().user_data;
          if (userData != null) {
            localStorage.setItem("user_data", userData);
            this.cargarDatosUsuario(userData);
            this.ipPublica();
          }

          // return true to indicate successful login
          return true;
        } else {
          // return false to indicate failed login
          return false;
        }
      })
      .catch(this.handleError);
  }

  logout(): void {
    // clear token remove user from local storage to log user out
    this.token = null;
    localStorage.clear();
    this.compiler.clearCache();
    window.location.href =
      window.location.origin + this.constantService.BASE_REF;

    setTimeout(() => {
      location.reload(); //equivale a: ctrl + f5
    }, 300);
  }

  logoutRequest() {
    const authorization = "Bearer " + localStorage.getItem("id_token");
    const headers = new Headers({
      "Content-Type": this.contentType,
      DireccionIP: localStorage.getItem("ip_publica"),
      DispositivoNavegador: this.navegador(),
      SistemaOperativo: authorization,
      Authorization: authorization,
    });
    const options = new RequestOptions({ headers: headers });
    const username = "?usuario=" + localStorage.getItem("username");
    if (localStorage.getItem("username")) {
      this.http.post(this.logoutUrl + username, {}, options).subscribe(
        () => {
          this.logout();
        },
        (error) => {
          setTimeout(() => {
            this.logout();
          }, 1000);
        }
      );
    }
  }

  cargarDatosUsuario(userData: string): void {
    if (userData != null) {
      var usuario: Usuario = JSON.parse(userData);
      if (usuario != null) {
        this.nombreCompleto = usuario.NombreCompleto;
        this.nombreUsuario = usuario.NombreUsuario;
      }
    }
  }

  ipPublica() {
    $.getJSON("https://api.ipify.org?format=jsonp&callback=?", function (data) {
      console.log(data);
      var res = JSON.stringify(data, null, 2);
      var resj = JSON.parse(res);

      localStorage.setItem("ip_publica", resj.ip);
    });
  }

  currentIpPublica() {
    return new Promise((resolve, reject) => {
      localStorage.setItem("ip_publica", "1.1.1.1");
      $.getJSON(
        "https://api.ipify.org?format=jsonp&callback=?",
        function (data) {
          var res = JSON.stringify(data, null, 2);
          var resj = JSON.parse(res);
          localStorage.setItem("ip_publica", resj.ip);
          resolve(resj.ip);
        }
      ).fail(function () {
        resolve("End");
      });
    });
  }

  navegador(): string {
    var userAgent = navigator.userAgent,
      tem,
      matchTest =
        userAgent.match(
          /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
        ) || [];
    if (/trident/i.test(matchTest[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
      return "IE " + (tem[1] || "");
    }
    if (matchTest[1] === "Chrome") {
      tem = userAgent.match(/\b(OPR|Edg)\/(\d+)/);
      if (tem) {
        return tem.slice(1).join(" ").replace("Edg", "Edge");
      }
      if (tem != null) {
        return tem.slice(1).join(" ").replace("OPR", "Opera");
      }
    }

    matchTest = matchTest[2]
      ? [matchTest[1], matchTest[2]]
      : [navigator.appName, navigator.appVersion, "-?"];

    tem = userAgent.match(/version\/(\d+)/i);
    if (tem !== null) {
      matchTest.splice(1, 1, tem[1]);
    }
    return matchTest.join("-");
  }

  sistemaOperativo(): string {
    var OSName;
    var versionCompleta = navigator.appVersion.split(";");
    if (versionCompleta.length < 1) {
      versionCompleta[0] = navigator.platform;
    }

    if (navigator.appVersion.indexOf("Win") !== -1) {
      OSName = `Windows ${versionCompleta[0]} )` + navigator.platform;
    }
    if (navigator.appVersion.indexOf("Mac") !== -1) {
      OSName = `MacOS ${versionCompleta[0]} )` + navigator.platform;
    }
    if (navigator.appVersion.indexOf("X11") !== -1) {
      OSName = `UNIX ${versionCompleta[0]} )` + navigator.platform;
    }
    if (navigator.appVersion.indexOf("Linux") !== -1) {
      OSName = `Linux ${versionCompleta[0]} )` + navigator.platform;
    }
    if (navigator.appVersion.indexOf("Android") !== -1) {
      OSName = `Android ${versionCompleta[0]} )` + navigator.platform;
    }
    return OSName;
  }

  getDatosUsuarioAutenticado() {
    var usuario: Usuario = null;
    var userData = localStorage.getItem("user_data");
    if (userData != undefined && userData != "") {
      usuario = JSON.parse(userData);
    }

    usuario.Correo = usuario.NombreUsuario + "@saludsa.com.ec";
    return usuario;
  }

  public isAuthorize(routeName: string): boolean {
    if (routeName === "/mainView") {
      return true;
    }
    let permisos = this.getPermisos();
    if (permisos != null) {
      // verificando administrador
      var admin = this.verifyAccess(permisos, Permiso.ADMINISTRADOR);
      if (admin) {
        return true;
      }

      var visorDocumentos = routeName.indexOf(
        "/liquidacion/visorArchivosRespaldo"
      );
      if (visorDocumentos !== -1) {
        return true;
      }

      //verificando acceso a reportes armonix
      const reportesArmonix = routeName.indexOf("reportes-armonix");
      const reportesArmonixServiciosAdicionales = routeName.indexOf(
        "reportes-servicios-adicionales"
      );
      const reportesArmonixCuadreCostoConsolidado = routeName.indexOf(
        "reportes-cuadre-costos-consolidado"
      );
      const reportesArmonixEstadosCuentaCartera = routeName.indexOf(
        "reportes-estados-cuenta-cartera"
      );
      const reportesArmonixCheques = routeName.indexOf("reportes-cheques");
      const reportesArmonixRetencionesSri = routeName.indexOf(
        "reportes-retenciones-electronicas-sri"
      );
      const reportesArmonixDocumentosEmitidos = routeName.indexOf(
        "reportes-documentos-emitidos-saludsa"
      );
      const reportesArmonixGrupales = routeName.indexOf("reportes-grupales");
      const reportesArmonixConsultasPago = routeName.indexOf(
        "reportes-consultas-pago"
      );
      const reportesArmonixMenuReportesReclamos = routeName.indexOf(
        "reportes-detalle-reclamos"
      );
      const reportesArmonixReclamos = routeName.indexOf(
        "reporte-detalle-reclamo"
      );
      const reportesArmonixReclamosPrestacion = routeName.indexOf(
        "reporte-detalle-reclamo-prestacion"
      );
      if (reportesArmonix !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixServiciosAdicionales !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_SERVICIOSADICIONALES
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixCuadreCostoConsolidado !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_CUADREDECOSTO
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixEstadosCuentaCartera !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_ESTADOSCUENTACARTERA
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixCheques !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_CHEQUES
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixRetencionesSri !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_RETELECTRONICASSRI
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixDocumentosEmitidos !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_DOCUMENTOSEMITIDOS
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixGrupales !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_GRUPALES
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixConsultasPago !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_CONSULTAPAGOS
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixMenuReportesReclamos !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_MENUREPORTESRECLAMOS
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixReclamos !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_RECLAMOS
        );
        if (accesoReportesArmonix) return true;
      }
      if (reportesArmonixReclamosPrestacion !== -1) {
        const accesoReportesArmonix = this.verifyAccess(
          permisos,
          Permiso.REP_ARMONIX_RECLAMOSPRESTACION
        );
        if (accesoReportesArmonix) return true;
      }

      // verificando acceso a consultas
      var consultaPath = routeName.indexOf("contratos");
      var estadoCuentaPath = routeName.indexOf("estadoCuenta");

      if (consultaPath !== -1 || estadoCuentaPath !== -1) {
        var consultaAccess = this.verifyAccess(permisos, Permiso.CONSULTA_FULL);
        if (consultaAccess) {
          return true;
        } else {
          if (consultaPath !== -1) {
            consultaAccess = this.verifyAccess(
              permisos,
              Permiso.CONSULTA_VENDEDOR
            );
            if (consultaAccess) return true;
          }

          if (consultaPath !== -1) {
            consultaAccess = this.verifyAccess(
              permisos,
              Permiso.CONSULTA_EXTERNA
            );
            if (consultaAccess) return true;
          }

          if (estadoCuentaPath !== -1) {
            consultaAccess = this.verifyAccess(
              permisos,
              Permiso.CONSULTA_REPORTE_ESTADO_CUENTA
            );
            if (consultaAccess) return true;
          }
        }
        return false;
      }

      var representanteNegocioPath = routeName.indexOf("representanteNegocio");
      if (representanteNegocioPath !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.CONSULTA_REPRESENTANTE_NEGOCIO
        );
      }

      var administracionReservaEscritorioPath =
        routeName.indexOf("parametrosReservas");
      if (administracionReservaEscritorioPath !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.ADMINISTRACION_REPORTES_ESCRITORIO
        );
      }

      var reporteCertificado = routeName.indexOf("reporteCertificado/form");
      if (reporteCertificado !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CERTIFICADOS_REPORTES);
        if (auth1) return true;
        return false;
      }

      var reporteCertificadoRN = routeName.indexOf("representanteNegocio/form");
      if (reporteCertificadoRN !== -1) {
        const authRN = this.verifyAccess(
          permisos,
          Permiso.CONSULTA_REPRESENTANTE_NEGOCIO
        );
        if (authRN) {
          return true;
        }
        return false;
      }

      var reportePreexistencia = routeName.indexOf("reportePreexistencia/form");
      if (reportePreexistencia !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CERTIFICADOS_REPORTES);
        if (auth1) return true;
        return false;
      }
      //Reportes Perfilamiento
      var RepPer = routeName.indexOf("reportePerfilamientoFV/form");
      if (RepPer !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_PERFILAMIENTO_FV);
      }
      var RepSac = routeName.indexOf("ReportePerfilamientoSAC/form");
      if (RepSac !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_PERFILAMIENTO_SAC);
      }
      var RepBaseT = routeName.indexOf("reporte3/form");
      if (RepBaseT !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.REPORTE_PERFILAMIENTO_BASE_TOTAL
        );
      }
      var RepLogC = routeName.indexOf("reporte5/form");
      if (RepLogC !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.REPORTE_PERFILAMIENTO_LOG_CARGA
        );
      }

      var reportesPca = routeName.indexOf("reportesPca/form");
      if (reportesPca !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTES_PCA);
      }

      //verifica acceso a Actualizaciones
      var actualizaPersonaUnica = routeName.indexOf("actualizarPersona");
      if (actualizaPersonaUnica !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.ACTUALIZACION);
        if (authAccess) return true;
      }

      var reporteMovPersona = routeName.indexOf("reporteMovPersona");
      if (reporteMovPersona !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.MENU_REPORT_MOV_PERSONA);
        if (authAccess) return true;
      }
      

      var usuarioPath = routeName.indexOf("crearEmpresa");
      if (usuarioPath !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.CREAR_EMP);
        var authAccess2 = this.verifyAccess(permisos, Permiso.EMPCREA);
        var authAccessEmpActCont = this.verifyAccess(
          permisos,
          Permiso.EMP_ACT_CONT
        );
        if (authAccess || authAccess2 || authAccessEmpActCont) {
          return true;
        }
      }

      // verificando acceso a autorizaciones
      var authPath = routeName.indexOf("autorizacion");
      var trackingAuthPath = routeName.indexOf("movimientos");
      var reporteAuthPath = routeName.indexOf("reporteAutorizacionesNormal");
      var reporteAuthPathInSitu = routeName.indexOf(
        "reporteAutorizacionesInSitu"
      );
      var reporteAuthPathExcepciones = routeName.indexOf(
        "reporteAutorizacionesExcepciones"
      );
      var observacionesAutorizaciones = routeName.indexOf(
        "observacionAutorizacion"
      );
      let paquetes = routeName.indexOf("paquetes");
      let reporteResultadoPrestadorAuthPath = routeName.indexOf("reporteResultadoPrestador");
      let reporteDiagnosticoProcedimientoAuthPath = routeName.indexOf("reporteDiagnosticoProcedimiento");

      if (
        authPath !== -1 ||
        trackingAuthPath !== -1 ||
        reporteAuthPath !== -1 ||
        reporteAuthPathInSitu !== -1 ||
        paquetes !== -1 ||
        reporteAuthPathExcepciones !== -1 ||
        reporteResultadoPrestadorAuthPath !== -1 ||
        reporteDiagnosticoProcedimientoAuthPath !== -1
      ) {
        var autorizacionFullAccess = this.verifyAccess(
          permisos,
          Permiso.AUTORIZACIONES_FULL
        );
        if (autorizacionFullAccess) {
          return true;
        } else {
          if (authPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_CRUD
            );
            if (authAccess) return true;
          }
          if (trackingAuthPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_TRACKING
            );
            if (authAccess) return true;
          }
          if (reporteAuthPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_REPORTE
            );
            if (authAccess) return true;
          }
          if (reporteAuthPathInSitu !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_REPORTE_IN_SITU
            );
            if (authAccess) return true;
          }
          if (reporteAuthPathExcepciones !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_REPORTE_EXCEPCIONES
            );
            if (authAccess) return true;
          }
          if (observacionesAutorizaciones !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_CATALOGO_OBSERVACIONES
            );
            if (authAccess) {
              return true;
            }
          }

          if (paquetes !== -1) {
            var authPaquetes = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_PAQUETES
            );
            if (authPaquetes) {
              return true;
            }
          }

          if (reporteResultadoPrestadorAuthPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_REPORTE
            );
            if (authAccess) return true;
          }

          if (reporteDiagnosticoProcedimientoAuthPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.AUTORIZACIONES_REPORTE
            );
            if (authAccess) return true;
          }
        }
      }

      // verificando acceso a odas
      var odasPath = routeName.indexOf("odas");
      if (odasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ODAS);
      }

      var reporteOdasPath = routeName.indexOf("reporteOdas");
      if (reporteOdasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ODAS);
      }

      var laboratoriosFarmaciasOdasPath = routeName.indexOf(
        "laboratoriosFarmacias"
      );
      if (laboratoriosFarmaciasOdasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ODAS_LABORATORIOS_FARMACIAS);
      }

      var reporteLaboratoriosFarmaciasOdasPath = routeName.indexOf(
        "reporteLaboratoriosFarmaciasOdas"
      );
      if (reporteLaboratoriosFarmaciasOdasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ODAS_LABORATORIOS_FARMACIAS);
      }

      // verificando acceso a administracion de usuarios
      var usuarioPath = routeName.indexOf("usuarios");
      if (usuarioPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ADMIN_USU_ROL);
      }
      var funcionalidadPath = routeName.indexOf("menuFuncionalidad");
      if (funcionalidadPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ADMIN_FUNCIONALIDAD);
      }
      var rolesPath = routeName.indexOf("roles");
      if (rolesPath !== -1) {
        return this.verifyAccess(permisos, Permiso.ADMIN_USU_ROL_ROL);
      }

      var laboratoriosFarmacias = routeName.indexOf("laboratoriosFarmacias");
      if (laboratoriosFarmacias !== -1) {
        return this.verifyAccess(permisos, Permiso.ODAS);
      }

      // verificando accceso a corporativo

      var grupoCorporativo = routeName.indexOf("consultarGrupoCorp");
      if (grupoCorporativo !== -1) {
        return this.verifyAccess(permisos, Permiso.CORPORATIVO_GRUPO);
      }

      var empresa = routeName.indexOf("EmpresaCorp");
      if (empresa !== -1) {
        return this.verifyAccess(permisos, Permiso.CORPORATIVO_CREAR);
      }

      var prefactura = routeName.indexOf("PagosConfCorp");
      if (prefactura !== -1) {
        return this.verifyAccess(permisos, Permiso.CORPORATIVO_CREAR);
      }

      var terminosCondiciones = routeName.indexOf("TerminosCondiciones");
      if (terminosCondiciones !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.CORPORATIVO_TERMINOSCONDICIONES
        );
      }

      var usuarioSaludAdm = routeName.indexOf("UsuarioSaludCorp");
      if (usuarioSaludAdm !== -1) {
        return this.verifyAccess(permisos, Permiso.CORPORATIVO_USUARIOSALUDADM);
      }

      var notCategoriaCorp = routeName.indexOf("CorpNotCategorias");
      if (notCategoriaCorp !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_NOTCATEGORIA);
      }

      var notEnviosCorp = routeName.indexOf("CorpNotEnvios");
      if (notEnviosCorp !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_NOTENVIO);
      }

      var listaCorporativo = routeName.indexOf("listaCorporativo");
      if (listaCorporativo !== -1) {
        return this.verifyAccess(permisos, Permiso.LISTA_CORPORATIVO_PALNES);
      }
      var corpRenova = routeName.indexOf("CorpRenovaciones");
      if (corpRenova !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_RENOV);
      }

      var corpReclamo = routeName.indexOf("CorpReclamosManuales");
      if (corpReclamo !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_REC);
      }

      var corpExt = routeName.indexOf("CorpExtension");
      if (corpExt !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_EXT);
      }

      var corpMovimientos = routeName.indexOf("CorpMovimientos");
      if (corpMovimientos !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_MOV);
      }

      var corpRC = routeName.indexOf("CorpRegistroCivil");
      if (corpRC !== -1) {
        return this.verifyAccess(permisos, Permiso.CORP_RC);
      }

      // Verificar Acceso a Corredores
      var grupoCorredores = routeName.indexOf(
        "CorredoresGrupoAgentesListComponent"
      );
      if (grupoCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.GRUP_BRO);
      }

      var adminCorredores = routeName.indexOf(
        "CorredoresAdmnistracionListComponent"
      );
      if (adminCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.CREA_BRO);
      }

      var condicionesCorredores = routeName.indexOf(
        "CorredoresCondicionesListComponent"
      );
      if (condicionesCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.TC_BRO);
      }

      var asignacionCorredores = routeName.indexOf(
        "CorredoresReasignacionListComponent"
      );
      if (asignacionCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.REASIG_BRO);
      }

      var asignacionReporteCorredores = routeName.indexOf(
        "CorredoresReporteReasignacionListComponent"
      );
      if (asignacionReporteCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.REP_REASIG_BRO);
      }

      var notCategoriaCorredores = routeName.indexOf(
        "CorredoresNotCategoriasListComponent"
      );
      if (notCategoriaCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.NOTCATEGORIA_BRO);
      }

      var notEnviosCorredores = routeName.indexOf(
        "CorredoresNotEnviosListComponent"
      );
      if (notEnviosCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.NOTENVIO_BRO);
      }

      var usuarioSaludAdmCorredores = routeName.indexOf("UsuarioSaludBro");
      if (usuarioSaludAdmCorredores !== -1) {
        return this.verifyAccess(permisos, Permiso.USUARIOSALUDADM_BRO);
      }

      //verificar Accesso a Reservas
      var txPath = routeName.indexOf("reporteReservas");
      if (txPath !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_RESERVAS);
      }
      var txPath = routeName.indexOf("configuracionReservas");
      if (txPath !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_RESERVAS);
      }
      var txPathReporte = routeName.indexOf("menuPrincipalReportes");
      if (txPathReporte !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_CONTABILIDAD);
      }

      const txPathReporteMasivos = routeName.indexOf("menuReportesMasivos");
      if (txPathReporteMasivos !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_PRESTADORES_MASIVOS);
      }

      var txPathConsultaRetenciones = routeName.indexOf("consultaRetenciones");
      if (txPathConsultaRetenciones !== -1) {
        return this.verifyAccess(
          permisos,
          Permiso.CONSULTA_RETENCION_FACT_PREST
        );
      }

      //PagoTransferencia
      var traspasoCredito = routeName.indexOf("PagoTransferenciaTraspaso");
      if (traspasoCredito !== -1) {
        return this.verifyAccess(permisos, Permiso.TRASPASO_CREDITO);
      }

      var cuadreCostoMensual = routeName.indexOf("reporteCuadreCostoMensual");
      if (cuadreCostoMensual !== -1) {
        return this.verifyAccess(permisos, Permiso.CUADRE_COSTO_MENSUAL);
      }

      var autorizacionTransferencia = routeName.indexOf("autorizacion");
      if (autorizacionTransferencia !== -1) {
        return this.verifyAccess(permisos, Permiso.AUTORIZACION_TRANSFERENCIA);
      }

      var prepagosTransferencia = routeName.indexOf("prepagos");
      if (prepagosTransferencia !== -1) {
        return this.verifyAccess(permisos, Permiso.PREPAGOS_TRANSFERENCIA);
      }

      var cuadreDiarioCosto = routeName.indexOf("reporteCuadreDiarioCosto");
      if (cuadreDiarioCosto !== -1) {
        return this.verifyAccess(permisos, Permiso.CUADRE_DIARIO_COSTO);
      }

      var cuadreDiario = routeName.indexOf("reporteCuadreDiario");
      if (cuadreDiario !== -1) {
        return this.verifyAccess(permisos, Permiso.CUADRE_DIARIO);
      }

      var masivos = routeName.indexOf('/masivos/liquidacionManual');
      if (masivos !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.MSVLIQMAN);
        if (auth) {
          return true;
        }
        return false;
      }

      // verificando acceso a liquidaciones
      var liquidacionReimpresionPath = routeName.indexOf("reimpresionLotes");
      if (liquidacionReimpresionPath !== -1) {
        return this.verifyAccess(permisos, Permiso.LIQUIDACION_REEIMPRESION);
      }
      var liquidacionPath = routeName.indexOf("liquidacion");
      if (liquidacionPath !== -1) {
        return this.verifyAccess(permisos, Permiso.LIQUIDACION_AUTH);
      }
      var liquidacionTraspasoPath = routeName.indexOf("traspasoCreditoCuenta");
      if (liquidacionTraspasoPath !== -1) {
        return this.verifyAccess(permisos, Permiso.LIQUIDACION_TRASPASO_AUTH);
      }

      // verificando acceso a transacciones
      var txPath = routeName.indexOf("transacciones");
      if (txPath !== -1) {
        return this.verifyAccess(permisos, Permiso.TRANSACCIONES);
      }

      var tranRep = routeName.indexOf("reporteMovimientos");
      if (tranRep !== -1) {
        return this.verifyAccess(permisos, Permiso.MOVIMIENTOS_REPORTE);
      }
      var RepFIN = routeName.indexOf("reporteFinanciamiento");
      if (RepFIN !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_FINANCIAMIENTO);
      }

      var tranRepVisa = routeName.indexOf("/reporteVisaciones/list");      
      if (tranRepVisa !== -1) {
        return this.verifyAccess(permisos, Permiso.VISACIONES_REPORTE);
      }

      var tranNotificacionFraude = routeName.indexOf("/notificacionFraudes/list");      
      if (tranNotificacionFraude !== -1) {
        return this.verifyAccess(permisos, Permiso.NOTIFICACION_FRAUDES);
      }

      var auditoriaConvenios = routeName.indexOf("auditoriaConvenios/list");
      if (auditoriaConvenios !== -1) {
        const authAccessAuditoria = this.verifyAccess(
          permisos,
          Permiso.AUDITORIA_CONVENIOS
        );
        if (authAccessAuditoria) {
          return true;
        }
      }

      var txPathCargaUmis = routeName.indexOf("cargaUmis");
      if (txPathCargaUmis !== -1) {
        return this.verifyAccess(permisos, Permiso.CARGAR_UMIS_XPR);
      }
      // verificando acceso a auditorias
      var auditoriasPath = routeName.indexOf("auditoria");
      if (auditoriasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.AUDITORIAS);
      }

      // verificando acceso a prestadores
      var prestadoresPath = routeName.indexOf("consultarPrestadores");
      var agendarCitasPath = routeName.indexOf("agendarCitaPrestador");
      var calificacionPrestadorPath = routeName.indexOf(
        "calificacionPrestador"
      );
      if (
        prestadoresPath !== -1 ||
        agendarCitasPath !== -1 ||
        calificacionPrestadorPath !== -1
      ) {
        var accessPrestadores = this.verifyAccess(
          permisos,
          Permiso.PRESTADORES_FULL
        );
        if (accessPrestadores) return true;
        else {
          if (prestadoresPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.PRESTADORES_CONSULTAR
            );
            var authAccess2 = this.verifyAccess(
              permisos,
              Permiso.ACTUALIZAR_CONVENIO
            );
            var authAccess3 = this.verifyAccess(
              permisos,
              Permiso.INGRESAR_CONVENIO
            );
            if (authAccess || authAccess2 || authAccess3) return true;
          }
          if (agendarCitasPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.PRESTADORES_AGENDAR_CITA
            );
            if (authAccess) return true;
          }
          if (calificacionPrestadorPath !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.PRESTADORES_CALIFICACION
            );
            if (authAccess) return true;
          }
        }
      }

      // verificando acceso a catalogos
      var catalogosDiagnostico = routeName.indexOf("diagnostico");
      var catalogoProcedimiento = routeName.indexOf("procedimiento");
      var catalogoValorPunto = routeName.indexOf("valorPunto");
      var crearEditarProcedimientos = routeName.indexOf("procedimiento");
      var catalogoTipoEmpresa = routeName.indexOf("tipoEmpresa");
      var catalogoRetencionDiferenciada = routeName.indexOf(
        "retencionDiferenciada"
      );
      var catalogoCoberturas = routeName.indexOf("coberturas");
      var catalogoBeneficios = routeName.indexOf("beneficios");
      var catalogoDeducibles = routeName.indexOf("deducibles");
      var catalogoGrupoAranceles = routeName.indexOf("grupoAranceles");

      if (
        catalogosDiagnostico !== -1 ||
        catalogoProcedimiento !== -1 ||
        catalogoValorPunto !== -1 ||
        catalogoTipoEmpresa !== -1 ||
        catalogoRetencionDiferenciada !== -1 ||
        catalogoCoberturas !== -1 ||
        catalogoBeneficios !== -1 ||
        catalogoDeducibles !== -1 ||
        catalogoGrupoAranceles !== -1
      ) {
        var accessCatalogos = this.verifyAccess(
          permisos,
          Permiso.CATALOGOS_FULL
        );
        if (accessCatalogos) return true;
        else {
          if (catalogosDiagnostico !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_DIAGNOSTICO
            );
            if (authAccess) return true;
          }

          if (catalogoProcedimiento !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_PROCEDIMIENTO
            );
            if (authAccess) return true;
          }

          if (catalogoValorPunto !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_VALOR_PUNTO
            );
            var authAccess2 = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_EDIT_VALOR_PUNTO
            );
            if (authAccess || authAccess2) return true;
          }
          if (crearEditarProcedimientos !== -1) {
            var accesoCrearProcedimientos = this.verifyAccess(
              permisos,
              Permiso.C_E_PROC
            );
            if (accesoCrearProcedimientos) {
              return true;
            }
          }
          if (catalogoTipoEmpresa !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_TIPO_EMPRESA
            );
            if (authAccess) return true;
          }
          if (catalogoRetencionDiferenciada !== -1) {
            var authAccess = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_RETENCION_DIFERENCIADA
            );
            if (authAccess) return true;
          }
          if (catalogoCoberturas !== -1) {
            var accesoCatalogoCoberturas = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_COBERTURAS
            );
            if (accesoCatalogoCoberturas) {
              return true;
            }
          }

          if (catalogoBeneficios !== -1) {
            var accesoCatalogoBeneficios = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_BENEFICIOS
            );
            if (accesoCatalogoBeneficios) {
              return true;
            }
          }

          if (catalogoDeducibles !== -1) {
            var accesoCatalogoDeducibles = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_DEDUCIBLES
            );
            if (accesoCatalogoDeducibles) {
              return true;
            }
          }

          if (catalogoGrupoAranceles !== -1) {
            var accesoCatalogoGrupoAranceles = this.verifyAccess(
              permisos,
              Permiso.CATALOGOS_GRUPO_ARANCEL
            );
            if (accesoCatalogoGrupoAranceles) {
              return true;
            }
          }
        }
      }

      //Verificando Permiso Sobres
      var reporteReservas = routeName.indexOf("reportesReservas");
      var sobresPorContrato = routeName.indexOf("sobresPorContrato");
      var sobresReportes = routeName.indexOf("reporteSobres");
      var sobresAsignar = routeName.indexOf("asignarSobres");
      var sobresConsultor = routeName.indexOf("listadoSobresConsultor");
      var sobresDevolucion = routeName.indexOf("devolucionSobres");
      var sobresAutorizar = routeName.indexOf("autorizarSobres");
      let anularSobre = routeName.indexOf("anularSobres");

      if (reporteReservas !== -1) {
        var authAccess1 = this.verifyAccess(
          permisos,
          Permiso.SIMULADOR_RESERVAS
        );
        var authAccess2 = this.verifyAccess(
          permisos,
          Permiso.HISTORICO_RESERVAS
        );
        var authAccess3 = this.verifyAccess(
          permisos,
          Permiso.REGENERACION_RESERVAS
        );

        if (authAccess1 || authAccess2 || authAccess3) {
          return true;
        }
      }

      if (sobresPorContrato !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.SOBRES_POR_CONTRATO
        );
        if (authAccess) return true;
      }

      if (sobresAsignar !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_ASIGNAR);
        if (authAccess) return true;
      }

      if (sobresReportes !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_REPORTE);
        if (authAccess) return true;
      }

      if (sobresConsultor !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_CONSULTOR);
        if (authAccess) return true;
      }

      if (sobresConsultor !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_CONSULTOR);
        if (authAccess) return true;
      }

      if (sobresDevolucion !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_DEVOLUCION);
        if (authAccess) return true;
      }

      if (sobresAutorizar !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SOBRES_AUTORIZAR);
        if (authAccess) return true;
      }

      if (anularSobre !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.ANULAR_SOBRES);
        if (authAccess) return true;
      }

      //verificar permisos para creditos
      var creditoPorContrato = routeName.indexOf("creditoPorContrato");
      var creditoReportes = routeName.indexOf("reporteCredito");
      var creditoAsignar = routeName.indexOf("asignarCredito");
      var creditoConsultor = routeName.indexOf("listadoCreditoConsultor");
      var creditoAutorizar = routeName.indexOf("autorizarCreditos");

      if (creditoPorContrato !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.INGRESAR_CREDITO);
        if (authAccess) return true;
      }

      if (creditoReportes !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.REPORTE_CREDITO);
        if (authAccess) return true;
      }

      if (creditoAsignar !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.ASIGNAR_CREDITO);
        if (authAccess) return true;
      }

      if (creditoConsultor !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.CONSULTOR_CREDITO);
        if (authAccess) return true;
      }

      if (creditoAutorizar !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.AUTORIZAR_CREDITO);
        if (authAccess) return true;
      }

      //VERIFICAR PERMISOS DE CITAS MEDICAS
      var agendarCitasSalud = routeName.indexOf("agendarCitasSalud");
      var solicitarCita = routeName.indexOf("solicitarCita");
      var consultaCitasSolicitud = routeName.indexOf("consultaCitasSolicitud");
      var updateCoordenadasPrestador = routeName.indexOf("updateCoordenadas");
      // var agendarCitasSalud = routeName.indexOf("agendarCitasSalud");

      if (agendarCitasSalud !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.AGENDAR_CITA_CENTRO_MEDICO
        );
        if (authAccess) return true;
      }

      if (solicitarCita !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.SOLICITUD_MEDICO_DESTACADO
        );
        if (authAccess) return true;
      }

      if (agendarCitasSalud !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.CONSULTAR_SOLICITUD
        );
        var authAccess2 = this.verifyAccess(permisos, Permiso.CONSULTAR_CITA);
        if (authAccess || authAccess2) return true;
      }

      if (consultaCitasSolicitud !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.CONSULTAR_CITA);
        if (authAccess) return true;
      }

      if (updateCoordenadasPrestador !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.UPDATE_COORDENADAS
        );
        if (authAccess) return true;
      }

      //Verificando Permiso rETENCIONES
      var retencionConsulta = routeName.indexOf("/retencion/list");
      var retencionInformacion = routeName.indexOf("/informacionRetencion/ver");
      var retencionReporte = routeName.indexOf("/reportes/filtro");
      var retencionDescuento = routeName.indexOf(
        "/retencion/descuento/parametros"
      );
      var retencionAprobacion = routeName.indexOf(
        "/retencion/descuento/reportes"
      );
      let retencionCliente = routeName.indexOf("/retencion/clientes");
      let retencionCasos = routeName.indexOf("/retencion/casos");
      let retencionGestion = routeName.indexOf("/retencion/gestiones");
      let retencionCasosCreate = routeName.indexOf(
        "/retencion/clientes/casos/create"
      );

      if (retencionConsulta !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_CONSULTA
        );
        if (authAccess) return true;
      }

      if (retencionInformacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_INFORMACION
        );
        if (authAccess) return true;
      }

      if (retencionReporte !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.RETENCION_REPORTE);
        if (authAccess) return true;
      }

      if (retencionDescuento !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_PARAMETRO_DESCUENTO
        );
        if (authAccess) return true;
      }

      if (retencionAprobacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_APROBACION
        );
        if (authAccess) return true;
      }

      if (retencionCasosCreate !== -1) {
        let authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_CLIENTES
        );
        if (authAccess) return true;
      }

      if (retencionCliente !== -1) {
        let authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_CLIENTES
        );
        if (authAccess) return true;
      }

      if (retencionCasos !== -1) {
        let authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_CLIENTES
        );
        if (authAccess) return true;
      }

      if (retencionGestion !== -1) {
        let authAccess = this.verifyAccess(
          permisos,
          Permiso.RETENCION_CLIENTES
        );
        if (authAccess) return true;
      }

      const retAnulacionImpuesto = routeName.indexOf("/retencion/anulacion-impuesto");
      if (retAnulacionImpuesto !== -1) {
        const authAccessRetAnu: boolean = this.verifyAccess(permisos, Permiso.RETENCION_ANULACION_IMPUESTO);
        if (authAccessRetAnu) {
          return true;
        }
      }

      const retencionAnulacion = routeName.indexOf("/retencion/anulaciones");
      if (retencionAnulacion !== -1) {
        const authAccessRetAnu: boolean = this.verifyAccess(
          permisos,
          Permiso.RETENCION_ANULACION
        );
        if (authAccessRetAnu) {
          return true;
        }
      }

      //COMERCIAL
      var carteraVentas = routeName.indexOf("reporteVendedores");
      var ejecutivoComercial = routeName.indexOf("ejecutivoComercial");
      var administrarFun = routeName.indexOf("administracionFunes");

      if (carteraVentas !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        if (authAccess) return true;
      }

      if (carteraVentas !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        if (authAccess) return true;
      }

      if (ejecutivoComercial !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.EJECUTIVO_COMERCIAL
        );
        if (authAccess) return true;
      }

      if (administrarFun !== -1) {
        var authAccess1 = this.verifyAccess(permisos, Permiso.ASIGNA_FUN);
        var authAccess2 = this.verifyAccess(permisos, Permiso.ANULA_FUN);
        var authAccess3 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_FUN
        );
        var authAccess4 = this.verifyAccess(permisos, Permiso.CREA_FUN);
        var authAccess5 = this.verifyAccess(permisos, Permiso.CONSULTA_FUN);
        if (
          authAccess1 ||
          authAccess2 ||
          authAccess3 ||
          authAccess4 ||
          authAccess5
        )
          return true;
      }

      //Permisos pestañas facturacion

      var procesoFacturacion = routeName.indexOf("procesoFacturacion");

      if (procesoFacturacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PROCESO_FACTUARACION
        );
        if (authAccess) return true;
      }

      var logErrores = routeName.indexOf("logErrores");

      if (logErrores !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.LOG_ERRORES);
        if (authAccess) return true;
      }

      var saldosFavor = routeName.indexOf("devolucionSaldoFavor");

      if (saldosFavor !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.SALDOS_FAVOR);
        if (authAccess) return true;
      }

      var notasCredito = routeName.indexOf("notasCredito");
      if (notasCredito !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.NOTAS_CREDITO);
        if (authAccess) return true;
      }

      var tareasProgramadasFacturacion = routeName.indexOf(
        "tareasProgramadasFacturacion"
      );
      if (tareasProgramadasFacturacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.TAREA_PROGRAMADA_NOTAS_LOTE
        );
        var authAccess1 = this.verifyAccess(
          permisos,
          Permiso.TAREA_PROGRAMADA_NOTAS_PCA
        );
        if (authAccess || authAccess1) return true;
      }

      var reportesFacturacion = routeName.indexOf("reportesFacturacion");
      if (reportesFacturacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.REPORTE_MOROSOS_POR_COBRAR
        );
        var authAccess2 = this.verifyAccess(
          permisos,
          Permiso.REPORTE_FACTURAS_EMITIDAS
        );
        var authAccess3 = this.verifyAccess(
          permisos,
          Permiso.REPORTE_CONSULTAS_PROBLEMAS
        );
        if (authAccess || authAccess2) return true;
      }

      var facturacionCotizacion = routeName.indexOf("cotizacionesPrincipal");
      if (facturacionCotizacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.COTIZACIONES_PRINCIPAL
        );
        if (authAccess) return true;
      }

      let facturacionIndPrevia = routeName.indexOf("facturacionIndPrevia");
      if (facturacionIndPrevia !== -1) {
        let authAccess = this.verifyAccess(
          permisos,
          Permiso.FACTURACION_IND_PREVIA
        );
        if (authAccess) return true;
      }

      var procesoFacturacion = routeName.indexOf(
        "consultaDocumentosFacturacion"
      );
      if (procesoFacturacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.CONSULTA_DOCS_ELECTRONICOS_DIRECTO_SRI
        );
        if (authAccess) return true;
      }

      var descParametrizacion = routeName.indexOf("descuentoParametrizacion");
      if (descParametrizacion !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.DESCUENTO_PARAMETRO
        );
        if (authAccess) return true;
      }

      var descParametrizacion = routeName.indexOf("ordenes");
      if (descParametrizacion !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.ORDENES_COMPRA);
        if (authAccess) return true;
      }

      //Recaudos SALUDPAY

      var recaudosSaludpay = routeName.indexOf("facturarCobros");
      if (recaudosSaludpay !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.REACAUDOS_SALUD_PAY
        );
        if (authAccess) return true;
      }

      //Recaudos BOTON CAJA PICHINCHA

      var recaudosCajaPich = routeName.indexOf("botonPago");

      if (recaudosCajaPich !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.REACAUDOS_BOTON_CAJA_PICHINCHA
        );
        if (authAccess) return true;
      }

      //Recaudos BOTON INGRESO CAJA
      var recaudosIngresoCaja = routeName.indexOf("ingresoCaja");
      if (recaudosIngresoCaja !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.INGRESO_CAJA);
        if (authAccess) return true;
      }

      //Recaudos BOTON CARGA RESPUESTAS
      var recaudosIngresoCaja = routeName.indexOf("menuCargaRespuestas");
      if (recaudosIngresoCaja !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.INGRESO_CAR_RES);
        if (authAccess) return true;
      }

      //Recaudos GENERACION ARCHIVOS DEBITOS INSTITUCIONES

      var reacaudosGenerarArchivosDebitosInstituciones = routeName.indexOf(
        "genearArchivosDebitosInstituciones"
      );

      if (reacaudosGenerarArchivosDebitosInstituciones !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.GENERAR_ARCHIVOS_DEBITOS_INSTITUCIONES
        );
        if (authAccess) return true;
      }

      //Planes corporativo
      var consultaPlanesCorporativos = routeName.indexOf("listaCorporativo");

      if (consultaPlanesCorporativos !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.CONSULTAR_PLANES_COR
        );
        if (authAccess) return true;
      }

      var adminPortalClientes = routeName.indexOf("portalClientes");

      if (adminPortalClientes !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.PORTAL_CLIENTES);
        if (authAccess) return true;
      }

      //Cobranzas
      var cobranzasFull = routeName.indexOf("gestionDeCobranzas");
      var menuReporteCobranzas = routeName.indexOf("menuReporteCobranzas");

      if (cobranzasFull !== -1 || menuReporteCobranzas !== -1) {
        var authAccess = this.verifyAccess(permisos, Permiso.COBRAZAS_FULL);
        if (authAccess) return true;

        var authAccessImp = this.verifyAccess(
          permisos,
          Permiso.COBRAZAS_IMPRESION
        );
        if (authAccessImp) return true;
      }

      //Imed Medcollect Auditoria Ambulatoria
      var medcollectAuditoria = routeName.indexOf(
        "/planificador/configuracion"
      );
      if (medcollectAuditoria != -1) {
        var authMedcollectAuditoria = this.verifyAccess(
          permisos,
          Permiso.LIQUIDACION_ELECTRONICA_PLANIFICADOR
        );
        if (authMedcollectAuditoria) {
          return true;
        }
        return false;
      }

      var negativaImed = routeName.indexOf(
        "/negativa/list"
      );
      if (negativaImed != -1) {
        var authNegativaImed = this.verifyAccess(
          permisos,
          Permiso.CONSULTA_NEGATIVA_IMED
        );
        if (authNegativaImed) {
          return true;
        }
        return false;
      }

      let planificador = routeName.indexOf("planificador");
      if (planificador !== -1) {
        let auth = this.verifyAccess(
          permisos,
          Permiso.NOTIFICACION_COBRANZA_JEFATURA
        );
        let auth1 = this.verifyAccess(permisos, Permiso.NOTIFICACION_COBRANZA);

        if (auth || auth1) return true;

        return false;
      }

      let moraPrimeraVez = routeName.indexOf("moraPrimeraVez");
      if (moraPrimeraVez !== -1) {
        let auth = this.verifyAccess(
          permisos,
          Permiso.NOTIFICACION_COBRANZA_JEFATURA
        );
        let auth1 = this.verifyAccess(permisos, Permiso.NOTIFICACION_COBRANZA);

        if (auth || auth1) return true;

        return false;
      }

      let noContactados = routeName.indexOf("noContactados");
      if (noContactados !== -1) {
        let auth = this.verifyAccess(
          permisos,
          Permiso.NOTIFICACION_COBRANZA_JEFATURA
        );
        let auth1 = this.verifyAccess(permisos, Permiso.NOTIFICACION_COBRANZA);

        if (auth || auth1) return true;

        return false;
      }

      let compromisoPago = routeName.indexOf("compromisoPago");
      if (compromisoPago !== -1) {
        let auth = this.verifyAccess(
          permisos,
          Permiso.NOTIFICACION_COBRANZA_JEFATURA
        );
        let auth1 = this.verifyAccess(permisos, Permiso.NOTIFICACION_COBRANZA);

        if (auth || auth1) return true;

        return false;
      }

      const grupales = routeName.indexOf("detalladoGrupales");
      if (grupales !== -1) {
        const authGrupales = this.verifyAccess(permisos, Permiso.REPORTE_DETALLADO_GRUPALES);
        if (authGrupales) {
          return true;
        }
        return false;
      }

      //Servicios Adicionales - Partner
      var menuServAdicBases = routeName.indexOf("srvAdicBases");
      if (menuServAdicBases !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_LISTBAS
        );
        if (authAccess) return true;
      }

      var menuServAdicPolAdmin = routeName.indexOf("srvAdicAdmin");
      if (menuServAdicPolAdmin !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_POLIZAS
        );
        if (authAccess) return true;
      }

      //Servicios Adicionales - Partner
      var menuServAdicBases = routeName.indexOf("srvAdicBases");
      if (menuServAdicBases !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_LISTBAS
        );
        if (authAccess) return true;
      }

      var menuServAdicPolAdmin = routeName.indexOf("srvAdicAdmin");
      if (menuServAdicPolAdmin !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_POLIZAS
        );
        if (authAccess) return true;
      }

      var menuServAdicTickets = routeName.indexOf("srvAdicTickets");
      if (menuServAdicTickets !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_TICKET
        );
        if (authAccess) return true;
      }

      var menuServAdicReporte = routeName.indexOf("srvAdicReporte");
      if (menuServAdicReporte !== -1) {
        var authAccess = this.verifyAccess(
          permisos,
          Permiso.PARTNER_SERV_ADIC_REPORTES
        );
        if (authAccess) return true;
        if (menuReporteCobranzas !== -1) {
          authAccess = this.verifyAccess(
            permisos,
            Permiso.COBRANZAS_MENU_REPORTE
          );
          if (authAccess) return true;
        }

        return false;
      }

      //COMSIONES

      //PARAMETRIZACION
      var parametrizacion = routeName.indexOf("menuParametrizacionComisiones");
      if (parametrizacion !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var parametrizacion = routeName.indexOf("noAcreditacionValores");
      if (parametrizacion !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      //PRESUPUESTOS
      var presupuestoVendedor = routeName.indexOf("presupuestos/vendedores");
      if (presupuestoVendedor !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var presupuestoDirector = routeName.indexOf("presupuestos/directores");
      if (presupuestoDirector !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var porcentajeRangoDirector = routeName.indexOf(
        "presupuestos/porcentajeRangosDirector"
      );
      if (porcentajeRangoDirector !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      //EXTRAPRESUPUESTO
      var extraPresupuestoDirector = routeName.indexOf(
        "presupuestos/extraPresupuesto"
      );
      if (extraPresupuestoDirector !== -1) {
        var authEjecutivo = this.verifyAccess(
          permisos,
          Permiso.EJECUTIVO_COMISIONES
        );
        var authAmin = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (authEjecutivo || authAmin) {
          return true;
        }
        return false;
      }

      //REFERIDOS
      var mantenimientoCalculo = routeName.indexOf("comisionCorporativo/form");
      if (mantenimientoCalculo !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      //PREMIOS
      var premios = routeName.indexOf("parametrizacionPremios/premios");
      if (premios !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;

        return false;
      }

      //PREMIOS BONOS
      var premiosBono = routeName.indexOf("premiosBonos");
      if (premiosBono !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      //CONSULTAS
      var consultaComisiones = routeName.indexOf("consultasComisiones");
      if (consultaComisiones !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      //SEMAFOROCOMISIONES
      var semaforoComisiones = routeName.indexOf("semaforoComisiones");
      if (semaforoComisiones !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;

        return false;
      }

      //MOVIMIENTOS MANUALES
      var movimientosManuales = routeName.indexOf("menuMovimientosManuales");
      if (movimientosManuales !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;

        return false;
      }

      //REPORTES
      var reporteanuladosCuotaUno = routeName.indexOf(
        "reportes/anuladosCuotaUno"
      );
      if (reporteanuladosCuotaUno !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      var reportepersistencia = routeName.indexOf("reportes/persistencia");
      if (reportepersistencia !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      var reportesemaforoVentas = routeName.indexOf("reportes/semaforoVentas");
      if (reportesemaforoVentas !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      var reporteBonos = routeName.indexOf("reportes/reporteBonos");
      if (reporteBonos !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.CONSULTA_VENDEDOR);
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      var reportePremiosAgencias = routeName.indexOf(
        "reportes/reportesPremiosBonosAgencias"
      );
      if (reportePremiosAgencias !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth2 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth3 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth4 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth5 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5) return true;

        return false;
      }

      var reportePremiosDirectores = routeName.indexOf(
        "reportes/reportesPremiosBonosDirectores"
      );
      if (reportePremiosDirectores !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth2 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth3 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth4 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth5 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4 || auth5) return true;

        return false;
      }

      var reporteComisiones = routeName.indexOf(
        "reportes/reportesContratosVendidos"
      );
      if (reporteComisiones !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth2 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth3 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2 || auth3 || auth4) return true;

        return false;
      }

      var reporteNomina = routeName.indexOf("reportes/nomina");
      if (reporteNomina !== -1) {
        let auth1 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        let auth2 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);

        if (auth1 || auth2) return true;

        return false;
      }

      var reporteAuditoria = routeName.indexOf("reportes/reporteLogAuditoria");
      if (reporteAuditoria !== -1) {
        let auth1 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        let auth2 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);

        if (auth1 || auth2) return true;

        return false;
      }

      var reporteBrokers = routeName.indexOf("reportes/reporteBrokers");
      if (reporteBrokers !== -1) {
        let auth1 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        let auth2 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);

        if (auth1 || auth2) return true;

        return false;
      }

      // REPORTE VARIOS CIERRES
      var reporteNominaVC = routeName.indexOf(
        "/reportes/reporteNominaAnticiposVC"
      );
      if (reporteNominaVC !== -1) {
        const adminComisiones = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        const ejeComision = this.verifyAccess(
          permisos,
          Permiso.EJECUTIVO_COMISIONES
        );

        if (adminComisiones || ejeComision) {
          return true;
        }
        return false;
      }

      var reporteNoAcreditacion = routeName.indexOf(
        "reportes/noAcreditacionValores"
      );
      if (reporteNoAcreditacion !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var reporteProvision = routeName.indexOf("reportes/provisionBrokers");
      if (reporteProvision !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(permisos, Permiso.ADMINISTRADOR_COMISIONES);
        if (auth1 || auth2) {
          return true;
        }

        return false;
      }

      var reportePreliquidacionPendientePago = routeName.indexOf("reportes/preliquidacionPendientePago");
      if (reportePreliquidacionPendientePago !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(permisos, Permiso.ADMINISTRADOR_COMISIONES);
        if (auth1 || auth2) {
          return true;
        }

        return false;
      }

      var reporteFacturasCargadas = routeName.indexOf("reportes/facturasCargadas");
      if (reporteFacturasCargadas !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(permisos, Permiso.ADMINISTRADOR_COMISIONES);
        var auth3 = this.verifyAccess(permisos, Permiso.CONTABILIDAD_COMISIONES);
        if (auth1 || auth2 || auth3) {
          return true;
        }

        return false;
      }

      var cierreComisiones = routeName.indexOf("cierreComisiones");
      if (cierreComisiones !== -1) {
        let auth2 = this.verifyAccess(permisos, Permiso.DIRECTOR_VENTAS);
        let auth3 = this.verifyAccess(permisos, Permiso.GERENTE_COMERCIAL);
        let auth4 = this.verifyAccess(
          permisos,
          Permiso.VICEPRESIDENTE_COMERCIAL
        );
        let auth5 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        let auth6 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth2 || auth3 || auth4 || auth5 || auth6) return true;

        return false;
      }

      var reprocesarComisiones = routeName.indexOf("reprocesarComisiones");
      if (reprocesarComisiones !== -1) {
        let auth1 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        let auth2 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);

        if (auth1 || auth2) return true;

        return false;
      }

      var directorVendedor = routeName.indexOf("directorVendedor");
      if (directorVendedor !== -1) {
        let auth1 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        let auth2 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);

        if (auth1 || auth2) return true;

        return false;
      }

      var parametrizacionBroker = routeName.indexOf("parametrizacionBroker");
      if (parametrizacionBroker !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var preliquidacionBroker = routeName.indexOf("plBrokers");
      if (preliquidacionBroker !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      var pagoBroker = routeName.indexOf("pagoBrokers");
      if (pagoBroker !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }
      var reprocesarBrokers = routeName.indexOf("reprocesarBrokers");
      if (reprocesarBrokers !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      //TICKETS COMISIONES
      var gestionTicketsComisiones = routeName.indexOf(
        "gestionTicketsComisiones"
      );
      if (gestionTicketsComisiones !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.COMISIONES_VER_TICKETS);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.COMISIONES_CREAR_TICKETS
        );
        var auth3 = this.verifyAccess(
          permisos,
          Permiso.COMISIONES_ASIGNAR_TICKETS
        );
        var auth4 = this.verifyAccess(
          permisos,
          Permiso.COMISIONES_GESTIONAR_TICKETS
        );

        if (auth1 || auth2 || auth3 || auth4) return true;

        return false;
      }

      // Reliquidaciones pendientes de nomina
      var reliquidacionesPendientes = routeName.indexOf("reliqPendNom");
      if (reliquidacionesPendientes !== -1) {
        var auth1 = this.verifyAccess(permisos, Permiso.EJECUTIVO_COMISIONES);
        var auth2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );

        if (auth1 || auth2) return true;
        return false;
      }

      //MASIVOS UNIVERSIDADES
      var masivosUniversidades = routeName.indexOf("masivosUniversidades");
      if (masivosUniversidades !== -1) {
        var authMasivosUniversidades = this.verifyAccess(
          permisos,
          Permiso.MASIVOS_UNIVERSIDADES
        );
        if (authMasivosUniversidades) {
          return true;
        }
        return false;
      }

      //Masivos - Grupales
      var masivoGrupal = routeName.indexOf("masivos/grupales");
      if (masivoGrupal !== -1) {
        var authMasivoGrupal = this.verifyAccess(permisos, Permiso.MASIVOS_GRUPALES);
        if (authMasivoGrupal) {
          return true;
        }
        return false;
      }

      //MASIVOS CONSULTAS
      var masivosConsultas = routeName.indexOf("masivos/consultasMasivos");
      if (masivosConsultas !== -1) {
        var authMasivo = this.verifyAccess(permisos, Permiso.CONSULTAS_MASIVOS);
        if (authMasivo) {
          return true;
        }
        return false;
      }
      //MASIVOS- reimprimir spp
      var reimprimirSpp = routeName.indexOf("masivos/reimprimirSpp");
      if (reimprimirSpp !== -1) {
        var authReimprimirSpp = this.verifyAccess(
          permisos,
          Permiso.REIMPRIMIR_SPP
        );
        if (authReimprimirSpp) {
          return true;
        }
        return false;
      }

      //MASIVOS
      var masivos = routeName.indexOf("masivos");
      if (masivos !== -1) {
        var authMasivos = this.verifyAccess(permisos, Permiso.MASIVOS);
        if (authMasivos) {
          return true;
        }
        return false;
      }

      var cambioEstado627 = routeName.indexOf("cambio-estado-6-27");
      if (cambioEstado627 !== -1) {
        var authTccp6a27 = this.verifyAccess(permisos, Permiso.TCCP6A27);
        if (authTccp6a27) {
          return true;
        }
        return false;
      }

      var adminRedes = routeName.indexOf("redes/list");
      if (adminRedes !== -1) {
        const authAdmRdPln = this.verifyAccess(permisos, Permiso.ADMRDPLN);
        if (authAdmRdPln) {
          return true;
        }
        return false;
      }

      var adminAgrupacion = routeName.indexOf("redes/agrupacion");
      if (adminAgrupacion !== -1) {
        const authAgrprds = this.verifyAccess(permisos, Permiso.AGRPRDS);
        if (authAgrprds) {
          return true;
        }
        return false;
      }

      var adminPlanGrupo = routeName.indexOf("redes/plan-grupo");
      if (adminPlanGrupo !== -1) {
        var authAsgnplngrp = this.verifyAccess(permisos, Permiso.ASGNPLNGRP);
        if (authAsgnplngrp) {
          return true;
        }
        return false;
      }

      //VITALITY
      var vitality = routeName.indexOf("menuPrincipalPagoInteligente");
      if (vitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_ACCESO_TOTAL);
        var auth2 = this.verifyAccess(permisos, Permiso.PI_ACCESSO_TOTAL);
        if (auth || auth2) return true;

        return false;
      }

      var pagosVitality = routeName.indexOf("menuPagosVitality");
      if (pagosVitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_ACCESO_TOTAL);
        var auth2 = this.verifyAccess(permisos, Permiso.VITALITY_MENU_PAGOS);
        if (auth || auth2) return true;

        return false;
      }

      var erroresVitality = routeName.indexOf("logsSuscripcionVitality");
      if (erroresVitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_LOG_ERRORES);
        if (auth) return true;

        return false;
      }

      var paramtrizacionVitality = routeName.indexOf(
        "menuPrincipalVitalityFees"
      );
      if (paramtrizacionVitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_MENU_FEES);
        if (auth) return true;

        return false;
      }

      var paramtrizacionVitality = routeName.indexOf(
        "menuPrincipalVitalityFees/categoriaFees"
      );
      if (paramtrizacionVitality !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_PARAMETRIZACION
        );
        if (auth) return true;

        return false;
      }

      var paramtrizacionVitality2 = routeName.indexOf(
        "menuPrincipalVitalityFees/vitalityFees"
      );
      if (paramtrizacionVitality2 !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_PARAMETRIZACION
        );
        if (auth) return true;

        return false;
      }

      var paramtrizacionVitality2 = routeName.indexOf(
        "menuPrincipalVitalityFees/vitalityFeesCorp"
      );
      if (paramtrizacionVitality2 !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_PARAMETRIZACION
        );
        if (auth) return true;

        return false;
      }

      var ejecucionFees = routeName.indexOf(
        "menuPrincipalVitalityFees/reportesVitalityFees"
      );
      if (ejecucionFees !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_EJECUCION_FEES);
        if (auth) return true;

        return false;
      }

      var menuConsultasGeneralesVit = routeName.indexOf("menuReportesVitality");
      if (menuConsultasGeneralesVit !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_CONSULTAS_GENERALES
        );
        if (auth) return true;

        return false;
      }
      var menuReportesVitality = routeName.indexOf("reporteVitality");
      if (menuReportesVitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_REPORTES);
        if (auth) return true;

        return false;
      }

      var menuPagoVentanilla = routeName.indexOf("menuPagosVentanilla");
      var PagoVentanillaPrestador = routeName.indexOf(
        "menuPrincipalPagoVentanillaPrestadores"
      );
      if (menuPagoVentanilla !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.PV_MENU_PRINCIPAL);
        if (auth) return true;

        return false;
      }
      if (PagoVentanillaPrestador !== -1) {
        var authPagoVentanilla = this.verifyAccess(permisos, Permiso.PV_PREST);
        if (authPagoVentanilla) {
          return true;
        }

        return false;
      }

      var menuReportesVitality = routeName.indexOf("reportesVitalityFinanzas");
      if (menuReportesVitality !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_REPORTES_FINANZAS
        );
        if (auth) {
          return true;
        }

        return false;
      }

      menuReportesVitality = routeName.indexOf("cashBackManual");
      if (menuReportesVitality !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.VITALITY_CB_MANUAL);
        if (auth) {
          return true;
        }
        return false;
      }

      var menuReportesVitality = routeName.indexOf("reportesVitality");
      if (menuReportesVitality !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_REPORTES_FINANZAS
        );
        if (auth) return true;

        return false;
      }
      var menuReportesVitality = routeName.indexOf(
        "configuracionRelojVitality"
      );
      if (menuReportesVitality !== -1) {
        var auth = this.verifyAccess(
          permisos,
          Permiso.VITALITY_CONFIGURACION_RELOJ
        );
        if (auth) return true;

        return false;
      }

      var menuMediktor = routeName.indexOf("consultaMediktor");
      if (menuMediktor !== -1) {
        var auth = this.verifyAccess(permisos, Permiso.MEDIKTOR);
        if (auth) return true;

        return false;
      }

      //kit bienvenida digital
      var KitBienvenida = routeName.indexOf("kitBienvenida/kitBienvenida");
      if (KitBienvenida !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.KIT_BIENVENIDA_DIGITAL);
        if (auth1) return true;
        return false;
      }
      var KitBienvenidaReporte = routeName.indexOf(
        "kitBienvenida/kitBienvenidaReporte"
      );
      if (KitBienvenidaReporte !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.KIT_BIENVENIDA_DIGITAL);
        if (auth1) return true;
        return false;
      }

      //Reportes Sac
      var reporteSac = routeName.indexOf("reporteCartera/form");
      if (reporteSac !== -1) {
        let auth1 = this.verifyAccess(permisos, Permiso.REPORTE_SAC);
        if (auth1) return true;
        return false;
      }

      var reporteMoraSac = routeName.indexOf("reporteMoraSac");
      if (reporteMoraSac !== -1) {
        const authFull = this.verifyAccess(permisos, Permiso.REPORTE_MORA_FULL);
        const authDir = this.verifyAccess(
          permisos,
          Permiso.REPORTE_MORA_DIRECTOR
        );
        const authVen = this.verifyAccess(
          permisos,
          Permiso.REPORTE_MORA_VENDEDOR
        );
        if (authFull || authDir || authVen) {
          return true;
        }
        return false;
      }

      //Archivo Texto Anulados
      var archivoTextoAnulados = routeName.indexOf("archivoTextoAnulados");
      if (archivoTextoAnulados !== -1) {
        var authAnulados = this.verifyAccess(permisos, Permiso.ARCH_TEX_ANUL);
        if (authAnulados) {
          return true;
        }
        return false;
      }

      //MODULO PAGO INTELIGENTE
      var admBancos = routeName.indexOf("menuAdministracionBancos");
      if (admBancos !== -1) {
        var admBan = this.verifyAccess(permisos, Permiso.PI_ADM_BANCOS);
        if (admBan) {
          return true;
        }
        return false;
      }

      var procesarPI = routeName.indexOf("menuProcesarPagoInteligente");
      if (procesarPI !== -1) {
        var ppi = this.verifyAccess(permisos, Permiso.PI_PROCESAR);
        if (ppi) {
          return true;
        }
        return false;
      }

      var gestionRebotesPI = routeName.indexOf("menuGestionRebotes");
      if (gestionRebotesPI !== -1) {
        var gestion = this.verifyAccess(permisos, Permiso.PI_GESTION_REBOTES);
        if (gestion) {
          return true;
        }
        return false;
      }

      var consultaAcreditacionesPI = routeName.indexOf(
        "menuConsultaAcreditaciones"
      );
      if (consultaAcreditacionesPI !== -1) {
        var acredt = this.verifyAccess(permisos, Permiso.PI_ACREDITACIONES);
        if (acredt) {
          return true;
        }
        return false;
      }

      var contabilidadPI = routeName.indexOf("menuContabilidad");
      if (contabilidadPI !== -1) {
        var contabilidad = this.verifyAccess(permisos, Permiso.PI_CONTABILIDAD);
        if (contabilidad) {
          return true;
        }
        return false;
      }

      var contabilidadPIRepReembolsos = routeName.indexOf("menuContabilidad");
      if (contabilidadPIRepReembolsos !== -1) {
        var contabilidad = this.verifyAccess(permisos, Permiso.PI_CONTA_REP_REEMBOLSOS);
        if (contabilidad) {
          return true;
        }
        return false;
      }

      var contabilidadPIRepPrestadores = routeName.indexOf("menuContabilidad");
      if (contabilidadPIRepPrestadores !== -1) {
        var contabilidad = this.verifyAccess(permisos, Permiso.PI_CONTA_REP_PRESTADORES);
        if (contabilidad) {
          return true;
        }
        return false;
      }

      var contabilidadPIRepVentanilla = routeName.indexOf("menuContabilidad");
      if (contabilidadPIRepVentanilla !== -1) {
        var contabilidad = this.verifyAccess(permisos, Permiso.PI_CONTA_REP_VENTANILLA);
        if (contabilidad) {
          return true;
        }
        return false;
      }

      var pagosPrestador = routeName.indexOf("menuConsultaPagosPrestaciones");
      if (pagosPrestador !== -1) {
        var pagosPres = this.verifyAccess(permisos, Permiso.PI_PAGOS_PRESTADOR);
        if (pagosPres) {
          return true;
        }
        return false;
      }

      var pagoIntReportesA = routeName.indexOf("reporteCuentasPrestadores");
      var pagoIntReportesB = routeName.indexOf("reportesGestionRebotes");
      var pagoIntReportesC = routeName.indexOf("reporteAcreditaciones");
      if (pagoIntReportesA !== -1 || pagoIntReportesB !== -1 || pagoIntReportesC !== -1) {
        if (pagoIntReportesA !== -1) {
          return this.verifyAccess(permisos, Permiso.PI_REP_CUENTAS_PRESTADORES);
        }
        if (pagoIntReportesB !== -1)
          return this.verifyAccess(permisos, Permiso.PI_REP_GESTION_REBOTES);
        if (pagoIntReportesC !== -1)
          return this.verifyAccess(permisos, Permiso.PI_REP_ACREDITACIONES);
      }

      var reportesCC = routeName.indexOf("menuReporteCreditoCuentaPrestador");
      if (reportesCC !== -1) {
        var authReportesCC = this.verifyAccess(permisos, Permiso.REP_CC_PREST);
        if (authReportesCC) {
          return true;
        }
        return false;
      }

      var reclamosPI = routeName.indexOf("menuReclamos");
      if (reclamosPI !== -1) {
        var authReclamosPI = this.verifyAccess(permisos, Permiso.RECL_PI);
        if (authReclamosPI) {
          return true;
        }
        return false;
      }

      var pagosPrestadores = routeName.indexOf("menuPagoPrestadores");
      if (pagosPrestadores !== -1) {
        var authPagosPrestadores = this.verifyAccess(
          permisos,
          Permiso.PAGOS_PREST
        );
        if (authPagosPrestadores) {
          return true;
        }
        return false;
      }

      var cambioEstadoPI = routeName.indexOf("menuCambioEstadoPI");
      if (cambioEstadoPI !== -1) {
        var authCambioEstadoPI = this.verifyAccess(
          permisos,
          Permiso.CAMBIO_ESTADO_PI
        );
        if (authCambioEstadoPI) {
          return true;
        }
        return false;
      }

      var actualizacionMasivaPOOL = routeName.indexOf(
        "/menuActualizacionMasivaDatosPool"
      );
      if (actualizacionMasivaPOOL !== -1) {
        var authMasPOOL = this.verifyAccess(permisos, Permiso.ACT_MASIVA_POOL);
        if (authMasPOOL) {
          return true;
        }
        return false;
      }

      var admParametrizacionPI = routeName.indexOf("/menuPrincipalTipoFormaPagoPI");
      if (admParametrizacionPI !== -1) {
        var autParametrizacionPI = this.verifyAccess(permisos, Permiso.TIPO_FORMA_PAGO_PI);
        if (autParametrizacionPI) {
          return true;
        }
        return false;
      }

      var aprobacionesPI = routeName.indexOf("/menuPrincipalAprobacionesPI");
      if (aprobacionesPI !== -1) {
        var autAprobacionesPI = this.verifyAccess(permisos, Permiso.PI_APROBACIONES_SOLICITUD_PAGO);
        if (autAprobacionesPI) {
          return true;
        }
        return false;
      }

      //Reporte Contratos Digitados
      var reporteContratosDigitados = routeName.indexOf(
        "reporteContratosDigitados"
      );
      if (reporteContratosDigitados !== -1) {
        var authDigitados = this.verifyAccess(permisos, Permiso.REP_CONT_DIG);
        if (authDigitados) {
          return true;
        }
        return false;
      }

      //Menu Historico Login
      var menuHistorico = routeName.indexOf("menuHistorico");
      if (menuHistorico !== -1) {
        var authHistoricoLogin = this.verifyAccess(
          permisos,
          Permiso.SEG_HISTORICO
        );
        if (authHistoricoLogin) {
          return true;
        }
        return false;
      }

      //Menu Historico Roles
      var menuRoles = routeName.indexOf("menuRoles");
      if (menuRoles !== -1) {
        var authHistoricoRoles = this.verifyAccess(permisos, Permiso.SEG_ROLES);
        if (authHistoricoRoles) {
          return true;
        }
        return false;
      }

      //Menu Historico funcionalidades
      var menuFuncionalidades = routeName.indexOf("registroFuncionalidades");
      if (menuFuncionalidades !== -1) {
        var authHistoricoFuncionalidades = this.verifyAccess(
          permisos,
          Permiso.SEG_HIS_FUNCIONALIDAD
        );
        if (authHistoricoFuncionalidades) {
          return true;
        }
        return false;
      }

      //Menu Detalles Usuarios
      var menuDetallesUsuarios = routeName.indexOf("menuDetallesUsuarios");
      if (menuDetallesUsuarios !== -1) {
        var authDetalleUsuarios = this.verifyAccess(
          permisos,
          Permiso.SEG_DET_USUARIOS
        );
        if (authDetalleUsuarios) {
          return true;
        }
        return false;
      }

      //Menu Reporte Usuario Rol
      var menuReporteUsuariosRol = routeName.indexOf("ReportesUsuariosRoles");
      if (menuReporteUsuariosRol !== -1) {
        var authReporteUsuariosRoles = this.verifyAccess(
          permisos,
          Permiso.SEG_USU_ROL
        );
        if (authReporteUsuariosRoles) {
          return true;
        }
        return false;
      }

      //Menu Logout
      var menuLogout = routeName.indexOf("menuLogout");
      if (menuLogout !== -1) {
        var authLogout = this.verifyAccess(permisos, Permiso.SEG_LOGOUT);
        if (authLogout) {
          return true;
        }
        return false;
      }

      //Generacion de Tarjetas
      var tarjetas = routeName.indexOf("generarTarjetas");
      if (tarjetas !== -1) {
        var authTarjetas = this.verifyAccess(permisos, Permiso.GENE_TARJE);
        if (authTarjetas) {
          return true;
        }
        return false;
      }

      //Carga de Contratos Masiva
      var subirC = routeName.indexOf("subirContratos");
      if (subirC !== -1) {
        var authSubirC = this.verifyAccess(permisos, Permiso.SUBI_CONT);
        if (authSubirC) {
          return true;
        }
        return false;
      }

      //Administracion Cuentas Salud
      var cueSal = routeName.indexOf("cuentaSalud/list");
      if (cueSal !== -1) {
        var authCueSal = this.verifyAccess(permisos, Permiso.CUENTAS_SALUD);
        if (authCueSal) {
          return true;
        }
        return false;
      }

      //Administracion preexistencias exoneradas
			var preExo = routeName.indexOf("preexistenciaExo/list");
			if (preExo !== -1) {
				var authPreExo = this.verifyAccess(permisos, Permiso.PREEXISTENCIA_EXO);
				if (authPreExo) {
					return true;
				}
				return false;
			}

      //Administracion negociaciones
			var negoci = routeName.indexOf("redes/negociaciones");
			if (negoci !== -1) {
				var authNegoci = this.verifyAccess(permisos, Permiso.NEGOCI);
				if (authNegoci) {
					return true;
				}
				return false;
			}

      // COMERCIAL MASIVOS

      var menuAgenteCallCenter = routeName.indexOf("agenteCallCenter");
      if (menuAgenteCallCenter !== -1) {
        var authCallCenter = this.verifyAccess(
          permisos,
          Permiso.AG_CALL_CENTER
        );
        if (authCallCenter) {
          return true;
        }
        return false;
      }

      //Varios Cierres Menu
      const menuVariosCierres = routeName.indexOf("menuVariosCierres");
      if (menuVariosCierres !== -1) {
        const authec1 = this.verifyAccess(
          permisos,
          Permiso.EJECUTIVO_COMISIONES
        );
        const authec2 = this.verifyAccess(
          permisos,
          Permiso.ADMINISTRADOR_COMISIONES
        );
        const authVC = this.verifyAccess(permisos, Permiso.MENU_VARIOS_CIERRES);
        if (authVC || authec1 || authec2) {
          return true;
        }
        return false;
      }

      //Actualizar SObre Reclamo
      var actualizaSobreReclamo = routeName.indexOf("/SobreReclamo");
      if (actualizaSobreReclamo !== -1) {
        var authSobreReclamo = this.verifyAccess(
          permisos,
          Permiso.ACTUALIZACION_SOBRE_RECLAMO
        );
        if (authSobreReclamo) {
          return true;
        }
        return false;
      }

      //Permisos SSO
      var accesoSsoEmpresa = routeName.indexOf("EmpresaSso");
      var accesoSsoTerminos = routeName.indexOf("TerminosSso");
      var accesoSsoUsuario = routeName.indexOf("UsuarioSso");
      var accesoSsoGrupos = routeName.indexOf("consultarGrupos");

      if (accesoSsoEmpresa !== -1) {
        return this.verifyAccess(permisos, Permiso.SSO_CREA);
      }

      if (accesoSsoTerminos !== -1) {
        return this.verifyAccess(permisos, Permiso.SSO_TERM);
      }

      if (accesoSsoUsuario !== -1) {
        return this.verifyAccess(permisos, Permiso.SSO_USU);
      }

      if (accesoSsoGrupos !== -1) {
        return this.verifyAccess(permisos, Permiso.SSO_GRU);
      }

      //Parametrizacion Observacion
      var accesoParametrizacionObservacion = routeName.indexOf(
        "parametrizacionObservacion"
      );
      if (accesoParametrizacionObservacion !== -1) {
        var authParametrizacionObservacion = this.verifyAccess(
          permisos,
          Permiso.PARAMETRIZACION_OBSERVACION
        );
        if (authParametrizacionObservacion) {
          return true;
        }
        return false;
      }

      //Factura Valor Consumido
      var accesoFacturaValorConsumido = routeName.indexOf(
        "facturaValorConsumido"
      );
      if (accesoFacturaValorConsumido !== -1) {
        var authFacturaValorConsumido = this.verifyAccess(
          permisos,
          Permiso.FACTURA_VALOR_CONSUMIDO
        );
        if (authFacturaValorConsumido) {
          return true;
        }
        return false;
      }

      //procedimientos para autorizaciones automáticas hospitalarias
      var procedimientosAutomaticos = routeName.indexOf(
        "automaticoProcedimientos"
      );
      if (procedimientosAutomaticos != -1) {
        var authProcedimientos = this.verifyAccess(
          permisos,
          Permiso.AUTOMATICO_PROCEDIMIENTOS
        );
        if (authProcedimientos) {
          return true;
        }
        return false;
      }

      var menuFacturaReclamos = routeName.indexOf("consultaFacturaReclamos");
      if (menuFacturaReclamos !== -1) {
        var consFacturasReclamos = this.verifyAccess(
          permisos,
          Permiso.CONS_FACTURAS_RECLAMOS
        );
        if (consFacturasReclamos) {
          return true;
        }
        return false;
      }

      var reporteEcuasistencia = routeName.indexOf("reporteEcuasistencia");
      if (reporteEcuasistencia !== -1) {
        var permisosEcua = this.verifyAccess(permisos, Permiso.REP_ECUA);
        if (permisosEcua) {
          return true;
        }
        return false;
      }

      //Reporte Ventas Visa- Contratos Masivos
      var reporteVentasVisa = routeName.indexOf("reporteVentasVisa");
      if (reporteVentasVisa !== -1) {
        var authReporteVisa = this.verifyAccess(permisos, Permiso.REP_VEN_VISA);
        if (authReporteVisa) {
          return true;
        }
        return false;
      }

      const admEspecialidadesMedicas = routeName.indexOf(
        "especialidadesMedicas"
      );
      if (admEspecialidadesMedicas !== -1) {
        const permisosCatgEspe = this.verifyAccess(permisos, Permiso.CATG_ESPE);
        if (permisosCatgEspe) {
          return true;
        }
        return false;
      }

      //Editar datos liquidacion
      var cambiarDatosLiquidacion = routeName.indexOf(
        "/cambioDatosLiquidacion"
      );
      if (cambiarDatosLiquidacion !== -1) {
        var authCambiarDatosLiquidacion = this.verifyAccess(
          permisos,
          Permiso.CAMBIAR_DATOS_LIQUIDACION
        );
        if (authCambiarDatosLiquidacion) {
          return true;
        }
        return false;
      }

      const mantenedorShift = routeName.indexOf("mantenedorShift");
      if (mantenedorShift !== -1) {
        const permisosMantendorShift = this.verifyAccess(
          permisos,
          Permiso.MANTENEDOR_SHIFT
        );
        if (permisosMantendorShift) {
          return true;
        }
        return false;
      }

      const reporteFraudePrestadores = routeName.indexOf("/reportePrestadoresIrregularidades");
      if (reporteFraudePrestadores !== -1) {
          const permisosFraudePrestadores = this.verifyAccess(
          permisos,
          Permiso.REPORTE_PRESTADORES_IRREGULARIDADES
        );
        if (permisosFraudePrestadores) {
          return true;
        }
        return false;
      }

      const reporteReclamosPrestadores = routeName.indexOf("/reporteReclamosPrestadores");
      if (reporteReclamosPrestadores !== -1) {
          return this.verifyAccess(permisos, Permiso.REPORTE_RECLAMOS_PRESTADORES);
      }


      //Carga Cuotas Masivas PCA
      var cuotaMasivaPca = routeName.indexOf("/cuotasMasivasPCA");
      if (cuotaMasivaPca !== -1) {
        var authcuotaMasivaPca = this.verifyAccess(
          permisos,
          Permiso.CARGA_CUOTAS_PCA
        );
        if (authcuotaMasivaPca) {
          return true;
        }
        return false;
      }

      //Carga Servicio CUN
      var servicioCun = routeName.indexOf("/CargaServicioCun");
      if (servicioCun !== -1) {
        var authservicioCun = this.verifyAccess(permisos, Permiso.CARGA_SERVICIO_CUN);
        if (authservicioCun) {
          return true;
        }
        return false;
      }

      var consultarPlanes = routeName.indexOf("/consultaPlanes");
      if (consultarPlanes !== -1) {
        var consultarPlanesPermiso = this.verifyAccess(permisos, Permiso.CONSULTAR_PLANES_IND);
        if (consultarPlanesPermiso) {
          return true;
        }
        return false;
      }      
      
      const mantenedorVademecum = routeName.indexOf("mantenedorVademecum");
      if (mantenedorVademecum !== -1) {
        return this.verifyAccess(permisos, Permiso.MANTENEDOR_VADEMECUM);
      }

      //Administracion Tarifarios
      var adminTarifario = routeName.indexOf("/admTarifarios");
      if (adminTarifario != -1) {
        var authAdminTarifarios = this.verifyAccess(permisos,Permiso.MANTENEDOR_TARIFARIOS);
        if (authAdminTarifarios) {
          return true;
        }
        return false;
      }

      var cotizadorPrestaciones = routeName.indexOf("/cotizadorPrestaciones");
      if (cotizadorPrestaciones !== -1) {
        var cotizadorPrestacionesPermiso = this.verifyAccess(permisos, Permiso.COTIZADOR_PRESTACIONES);
        if (cotizadorPrestacionesPermiso) {
          return true;
        }
        return false;
      }

      var auditoriasPath = routeName.indexOf("reporteContactosPrestador");
      if (auditoriasPath !== -1) {
        return this.verifyAccess(permisos, Permiso.REPORTE_CONTACTO_PRESTADOR);
      }
    }
    return false;
  }

  private verifyAccess(permisos: string[], permiso: string): boolean {
    var access = permisos.find((p) => p == permiso);
    if (access != undefined) {
      this.tipoPermiso = permiso;
      return true;
    }
    return false;
  }

  public isAuthorizeAction(actionName: string): boolean {
    /* var authorize = false;
      let permisos = localStorage.getItem("permisos");
      if (permisos != null) {
          var permisoWebClient = result.findIndex(p => p.Tipo == 2 && p.NombreEfectivo == actionName);
          authorize = permisoWebClient != -1;
      }
      return authorize;*/
    return true;
  }

  public isAuthorizeRequest(timeout?: number): boolean {
    var isTokenRefreshing = localStorage.getItem("is_token_refreshing");
    if (isTokenRefreshing != null && isTokenRefreshing == "true") {
      return true;
    } else {
      var token = localStorage.getItem("id_token");
      if (token != null) {
        if (!this.jwtHelper.isTokenExpired(token)) {
          let expirationDateMiliseconds = this.jwtHelper
            .getTokenExpirationDate(token)
            .getTime();
          let currentDateMiliseconds = new Date().getTime();
          if (expirationDateMiliseconds - currentDateMiliseconds <= 7200000) {
            localStorage.setItem("is_token_refreshing", "true");
            this.refreshToken().subscribe((result) => {
              localStorage.removeItem("is_token_refreshing");
            });
            return true;
          } else return true;
        } else {
          this.showExpiredPopup(timeout);
          return false;
        }
      } else {
        // not token in so logout
        this.logoutRequest();
        return false;
      }
    }
  }

  public showExpiredPopup(timeout?: number): void {
    var time = timeout == undefined || timeout == null ? 100 : timeout;
    setTimeout(() => {
      swal(
        {
          title: "Error",
          text: "<h3>Su sesión ha expirado</h3>",
          type: "error",
          confirmButtonColor: "#1a7bb9",
          confirmButtonText: "OK",
          closeOnConfirm: true,
          html: true,
        },
        () => {
          this.logoutRequest();
        }
      );
    }, time);
  }

  public getExpiredError() {
    return Observable.throw(new AuthHttpError("Token expirado"));
  }

  private handleError(error: any) {
    // Comentar en produccion
    console.error(error);
    return Observable.throw(error);
  }

  public transformarFecha(fechaString: string) {
    if (fechaString != undefined) {
      let fecha = fechaString.split("/");
      var fechaTrasformada = fecha[1] + "/" + fecha[0] + "/" + fecha[2];
      return new Date(fechaTrasformada);
    }
    return undefined;
  }

  public showErrorPopup(error: any) {
    if (error == "" || error == "Token expirado") {
      this.showExpiredPopup(300);
    } else {
      setTimeout(() => {
        swal({
          title: "",
          text: "<h3>" + error + "</h3>",
          html: true,
          type: "error",
          confirmButtonColor: "#1a7bb9",
          confirmButtonText: "OK",
          closeOnConfirm: true,
        });
      }, 100);
    }
  }

  public showInfoPopup(ok: any) {
    setTimeout(() => {
      swal({
        title: "",
        text: "<h4>" + ok + "</h4>",
        html: true,
        type: "info",
        confirmButtonColor: "#1a7bb9",
        confirmButtonText: "OK",
        closeOnConfirm: true,
      });
    }, 100);
  }

  public showSuccessPopup(ok: any) {
    setTimeout(() => {
      swal({
        title: "",
        text: `<h4>${ok}</h4>`,
        html: true,
        type: "success",
        confirmButtonColor: "#1a7bb9",
        confirmButtonText: "OK",
        closeOnConfirm: true,
      });
    }, 100);
  }

  public showWarningPopup(ok: any) {
    setTimeout(() => {
      swal({
        title: "",
        text: "<h4>" + ok + "</h4>",
        html: true,
        type: "warning",
        confirmButtonColor: "#1a7bb9",
        confirmButtonText: "OK",
        closeOnConfirm: true,
      });
    }, 100);
  }

  public showBlobErrorPopup(error: any) {
    if (error._body instanceof Blob) {
      var myBlob = new Blob([error._body], { type: "application/json" });
      var myReader = new FileReader();
      var errMsg = null;
      myReader.addEventListener("loadend", function (e: any) {
        errMsg = e.srcElement.result;
        if (errMsg != undefined)
          errMsg = JSON.parse(e.srcElement.result).Message;
        else errMsg = "Ha ocurrido un error.";
        swal({
          title: "",
          text: "<h3>" + errMsg + "</h3>",
          html: true,
          type: "error",
          confirmButtonColor: "#1a7bb9",
          confirmButtonText: "OK",
          closeOnConfirm: true,
        });
      });
      myReader.readAsText(myBlob);
    }
  }

  public getPermisos(): string[] {
    var result: string[] = [];
    var token = localStorage.getItem('id_token');
    if (token != undefined) {
      var jwtHelper: JwtHelper = new JwtHelper();
      var decode = jwtHelper.decodeToken(token);
      if (decode.role != undefined) {
        if (decode.role instanceof Array)
          result = decode.role;
        else
          result.push(decode.role);
      } else {
        var roles = decode["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (roles != undefined) {
          if (roles instanceof Array)
            result = roles;
          else
            result.push(roles);
        }
      }
    }
    return result;
  }

  public showPopupResultadoConfirm(msg: string, metodo: () => void): void {
    swal({
      title: "",
      text: "<h3>" + msg + "</h3>",
      html: true,
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#1a7bb9",
      confirmButtonText: "SI",
      cancelButtonText: "NO",
      closeOnConfirm: true,

    },
      confirmed => {
        if (confirmed) {
          metodo();
        }
      });
  }


  public showPopUpInput(titulo: string, texto: string, placeholder: string, mensajeError: string,
    funcionManejoValor: (parametro: any) => any, funcionValidacionValor: (parametro: any) => boolean) {
    swal({
      title: titulo,
      text: texto,
      type: "input",
      showCancelButton: true,
      closeOnConfirm: false,
      animation: "slide-from-top",
      inputPlaceholder: placeholder
    },
      function (inputValue) {
        if (inputValue === null) {
          swal.showInputError("El valor no puede ser nulo");
          return false;
        };

        if (!funcionValidacionValor(inputValue)) {
          swal.showInputError(mensajeError);
          return false
        }

        funcionManejoValor(inputValue);
      });
  }

  correoDesbloqueo(usuario: string): Observable<any> {
    return Observable.create((observe) => {
      this.currentIpPublica().then(() => {
        const headers = new Headers({
          "Content-Type": this.contentType,
          DireccionIP: localStorage.getItem("ip_publica"),
          DispositivoNavegador: this.navegador(),
          SistemaOperativo: this.sistemaOperativo(),
        });
        const options = new RequestOptions({ headers: headers });
        this.http
          .get(this.desbloqueoCorreoUrl + usuario, options)
          .map((response: Response) => {
            if (response) {
              return { status: true };
            } else {
              return { status: false};
            }
          })
          .catch(this.handleError)
          .subscribe(
            (response) => {
              observe.next(response);
              observe.complete();
            },
            (error) => {
              observe.error(error);
              observe.complete();
            }
          );
      });
    });
  }

  desbloqueoUsuarioCuentaActiva(usuario: string): Observable<any> {
    return Observable.create((observe) => {
      this.currentIpPublica().then(() => {
        const headers = new Headers({
          "Content-Type": this.contentType,
          DireccionIP: localStorage.getItem("ip_publica"),
          DispositivoNavegador: this.navegador(),
          SistemaOperativo: this.sistemaOperativo(),
        });
        const options = new RequestOptions({ headers: headers });
        this.http
          .get(this.desbloqueoUrl + usuario, options)
          .map((response: Response) => {
            if (response) {
              return { status: true };
            } else {
              return { status: false};
            }
          })
          .catch(this.handleError)
          .subscribe(
            (response) => {
              observe.next(response);
              observe.complete();
            },
            (error) => {
              observe.error(error);
              observe.complete();
            }
          );
      });
    });
  }

  noDesbloqueoUsuario(usuario: string): Observable<any> {
    return Observable.create((observe) => {
      this.currentIpPublica().then(() => {
        const headers = new Headers({
          "Content-Type": this.contentType,
          DireccionIP: localStorage.getItem("ip_publica"),
          DispositivoNavegador: this.navegador(),
          SistemaOperativo: this.sistemaOperativo(),
        });
        const options = new RequestOptions({ headers: headers });
        this.http
          .get(this.noDesbloqueoUrl + usuario, options)
          .map((response: Response) => {
            if (response) {
              return { status: true };
            } else {
              return { status: false};
            }
          })
          .catch(this.handleError)
          .subscribe(
            (response) => {
              observe.next(response);
              observe.complete();
            },
            (error) => {
              observe.error(error);
              observe.complete();
            }
          );
      });
    });
  }
}

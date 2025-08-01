import { Injectable } from '@angular/core';
import { Headers, RequestOptions, RequestOptionsArgs, RequestMethod, Request, ResponseContentType, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { AuthHttp, AuthHttpError } from 'angular2-jwt';
import { AuthService } from './auth.service';
import { ConstantService } from '../utils/constant.service';

export enum Action { QueryStart, QueryStop };

@Injectable()
export class AppAuthHttp {

  ip: string;
  sistemaOperativo: string;
  disNavegacion: string;
  codAplicacion: string;
  codPlataforma: string;

  constructor(private http: Http, public authHttp: AuthHttp, private authService: AuthService, private constantService: ConstantService) {
    this.createExtraHeaders();
  }

  navegador(): string {
    var userAgent = navigator.userAgent, tem,
    matchTest = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(matchTest[1])){
        tem =  /\brv[ :]+(\d+)/g.exec(userAgent) || [];
        return 'IE '+(tem[1] || '');
    }
    if(matchTest[1]=== 'Chrome'){
        tem = userAgent.match(/\b(OPR|Edg)\/(\d+)/);
        if(tem){
            return tem.slice(1).join(' ').replace('Edg', 'Edge');}
        if(tem!= null){
            return tem.slice(1).join(' ').replace('OPR', 'Opera');}
    }

    matchTest= matchTest[2]? [matchTest[1], matchTest[2]]: [navigator.appName, navigator.appVersion, '-?'];

    tem = userAgent.match(/version\/(\d+)/i);
    if(tem !== null){
        matchTest.splice(1, 1, tem[1]);
    }
    return matchTest.join('-');
  }

  createExtraHeaders() {

    var OSName = "Desconocido";
    var versionCompleta = navigator.appVersion.split(";");
    if (versionCompleta.length < 1)
      versionCompleta[0] = navigator.platform;

    if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows " + versionCompleta[0] + ") " + navigator.platform;
    if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS " + versionCompleta[0] + ") " + navigator.platform;
    if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX " + versionCompleta[0] + ") " + navigator.platform;
    if (navigator.appVersion.indexOf("Linux") != -1) OSName = "Linux " + versionCompleta[0] + ") " + navigator.platform;
    if (navigator.appVersion.indexOf("Android") != -1) OSName = "Android " + versionCompleta[0] + ") " + navigator.platform;

    this.codAplicacion = localStorage.getItem("codigo_aplicacion");
    this.codPlataforma = localStorage.getItem("codigo_plataforma");
    this.disNavegacion = this.navegador();
    this.sistemaOperativo = OSName;
    this.ip = localStorage.getItem("ip_publica");
    if (this.ip == undefined || this.ip == null) {
      this.ip = "1.1.1.1"
    }
  }

  public sendFile(url: string, body: any, options?: RequestOptionsArgs) {
    let formData: FormData = new FormData();
    formData.append('fileKey', body, body.name);
    return this._requestWithFile(RequestMethod.Post, url, formData, options)
  }

  public get(url: string, options?: RequestOptionsArgs, cabecera?: string) {
    return this._request(RequestMethod.Get, url, null, null, null, options, cabecera);
  }

  public getPaginated(url: string, pageNumber: number, pageSize: number, options?: RequestOptionsArgs, cabecera?: string) {
    return this._request(RequestMethod.Get, url, null, pageNumber, pageSize, options, cabecera);
  }

  public post(url: string, body: string, options?: RequestOptionsArgs, cabecera?: string) {
    return this._request(RequestMethod.Post, url, body, null, null, options, cabecera);
  }

  public postForm(url: string, form: FormData, options?: RequestOptionsArgs){
    return this._requestWithFile(RequestMethod.Post,url,form,options);
  }

  public postPaginated(url: string, body: string, pageNumber: number, pageSize: number, options?: RequestOptionsArgs, cabecera?: string) {
    return this._request(RequestMethod.Post, url, body, pageNumber, pageSize, options, cabecera);
  }

  public put(url: string, body: string, options?: RequestOptionsArgs) {
    return this._request(RequestMethod.Put, url, body, null, null, options);
  }

  public putWithHeader(url: string, body: string, options?: RequestOptionsArgs) {
    return this._request(RequestMethod.Put, url, body, null, null, options, "SI");
  }

  public delete(url: string, options?: RequestOptionsArgs) {
    return this._request(RequestMethod.Delete, url, null, null, null, options, "SI");
  }

  public postGetFile(url: string, body: string, options?: RequestOptionsArgs, cabecera?: string) {
    return this.getFile(RequestMethod.Post, url, body, options, cabecera);
  }

  public getGetFile(url: string, options?: RequestOptionsArgs) {
    return this.getFile(RequestMethod.Get, url, null, options);
  }

  public getFile(requestMethod: RequestMethod, url: string, body: string, options?: RequestOptionsArgs, cabecera?: string) {
    let requestOptions = new RequestOptions(Object.assign({
      method: requestMethod,
      url: url,
      body: body,
      headers: this._createHeaders(null, null, cabecera)
    }, { responseType: ResponseContentType.Blob }));

    if (this.authService.isAuthorizeRequest()) {
      return this.authHttp.request(new Request(requestOptions));
    } else
      return this.authService.getExpiredError();
  }

  private _createHeaders(pageNumber?: number, pageSize?: number, cabecera?: string): Headers {
    var headers: Headers;
    if (cabecera != null && cabecera != undefined && cabecera == "SI") {
      this.createExtraHeaders();
      if (pageNumber == null || pageNumber == undefined || pageSize == null || pageSize == undefined) {
        headers = new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'CodigoAplicacion': this.codAplicacion,
          'CodigoPlataforma': this.codPlataforma,
          'SistemaOperativo': this.sistemaOperativo,
          'DispositivoNavegador': this.disNavegacion,
          'DireccionIP': this.ip
        });
      } else if (pageNumber != null && pageSize != null) {
        headers = new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Page-Number': pageNumber,
          'X-Page-Size': pageSize,
          'CodigoAplicacion': this.codAplicacion,
          'CodigoPlataforma': this.codPlataforma,
          'SistemaOperativo': this.sistemaOperativo,
          'DispositivoNavegador': this.disNavegacion,
          'DireccionIP': this.ip
        });
      }
    } else {
      if (pageNumber == null || pageNumber == undefined || pageSize == null || pageSize == undefined) {
        headers = new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        });
      } else if (pageNumber != null && pageSize != null) {
        headers = new Headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Page-Number': pageNumber,
          'X-Page-Size': pageSize
        });
      }
    }
    return headers;
  }

  private _requestWithFile(method: RequestMethod, url: string, body?: any, options?: RequestOptionsArgs): Observable<any> {
    let requestOptions = new RequestOptions(Object.assign({
      method: method,
      url: url,
      body: body,
      headers: this.cargarCabeceras()
    }, options));

    if (this.authService.isAuthorizeRequest((method == RequestMethod.Delete ? 300 : 100))) {
      return this.authHttp.request(new Request(requestOptions));
    } else
      return this.authService.getExpiredError();
  }

  private _request(method: RequestMethod, url: string, body?: string, pageNumber?: number, pageSize?: number, options?: RequestOptionsArgs, cabecera?: string): Observable<any> {
    let requestOptions = new RequestOptions(Object.assign({
      method: method,
      url: url,
      body: body,
      headers: this._createHeaders(pageNumber, pageSize, cabecera)
    }, options));

    if (this.authService.isAuthorizeRequest((method == RequestMethod.Delete ? 300 : 100))) {
      return this.authHttp.request(new Request(requestOptions));
    } else
      return this.authService.getExpiredError();
  }

  public handleError(error: any) {
    if (!(error instanceof AuthHttpError) && error.message != 'No JWT present or has expired') {
      let errMsg = (error.message) ? error.message : error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      if (error.status != null) {
        if (error.status == "504") {
          errMsg = "No existe conexión. Tiempo de espera agotado.";
        }
        else {
          if (error.status == "400") {
            errMsg = "Error datos enviados en la cabecera";
          } else if (error.status == "500") {
            errMsg = "Error interno del servidor, por favor comuníquese con el administrador del sistema";
          } else if (error.status == "0") {
            errMsg = "El servicio no responde. Tiempo de espera agotado."
          } else {
            errMsg = (error._body) ? JSON.parse(error._body).Message : errMsg;
          }
        }
      }
      return Observable.throw(errMsg);
    }
    return Observable.throw("");
  }

  cargarCabeceras(): Headers {
    this.createExtraHeaders();
    var headers = new Headers({
      'CodigoAplicacion': this.codAplicacion,
      'CodigoPlataforma': this.codPlataforma,
      'SistemaOperativo': this.sistemaOperativo,
      'DispositivoNavegador': this.disNavegacion,
      'DireccionIP': this.ip
    });
    return headers;
  }
}

export var EXTHTTPPROVIDERS: Array<any> = [
  Action, AppAuthHttp
];
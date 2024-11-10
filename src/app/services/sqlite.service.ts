import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { JsonSQLite } from 'jeep-sqlite/dist/types/interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  public dbReady: BehaviorSubject<boolean>;
  public isWeb: boolean;
  public isIos: boolean;
  public dbname='';


  constructor(private httpclient: HttpClient) {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIos = false;
    this.dbname = '';
   }

  async init(){
      const info = await Device.getInfo();
      const sqlite = CapacitorSQLite as any;

      if (info.platform == 'android'){
        try {
          await sqlite.requestPermissions();
        } catch (error) {
          console.error("Esta app necesita permisos para funcionar")
        }
      } else if (info.platform == 'web') {
          this.isWeb = true;
          await sqlite.initWebStore();
      } else if (info.platform == 'ios') {
        this.isIos = true;
      }
    this.setupDatabase();
  }//finMetodo


  async setupDatabase(){
      const dbSetup = await Preferences.get({ key: 'first_setup_key' })
      if (!dbSetup.value) {
        this.downloadDatabase();
      } else {
        this.dbname = await this.getDbName();
        await CapacitorSQLite.createConnection({ database: this.dbname });
        await CapacitorSQLite.open({ database: this.dbname })
        this.dbReady.next(true);
      }
  }


  downloadDatabase() {
     this.httpclient.get('assets/db/basedata.json').subscribe(async (jsonExport: JsonSQLite) => {
        const jsonstring = JSON.stringify(jsonExport);
        const isValid = await CapacitorSQLite.isJsonValid({ jsonstring });
        if (isValid.result) {
          this.dbname = jsonExport.database;
          await CapacitorSQLite.importFromJson({ jsonstring });
          await CapacitorSQLite.createConnection({ database: this.dbname });
          await CapacitorSQLite.open({ database: this.dbname })
          await Preferences.set({ key: 'first_setup_key', value: '1' })
          await Preferences.set({ key: 'dbname', value: this.dbname })
          this.dbReady.next(true);
        }
      })
  }//fin

  async getDbName() {
      if (!this.dbname) {
        const dbname = await Preferences.get({ key: 'dbname' })
        if (dbname.value) {
          this.dbname = dbname.value
          }
      }
      console.log(this.dbname);
      return this.dbname;
  }

  async create(rut: string, email: string, password:string) {
    let sql = 'INSERT INTO usuarios VALUES(?,?,?)';
    const dbname = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: dbname,
      set: [
        {
          statement: sql,
          values: [
            rut,
            email,
            password

          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: dbname });
      }
      return changes;
    }).catch(err => Promise.reject(err))
  }

  
  async read() {
    let sql = 'SELECT * FROM usuarios';
    const dbname = await this.getDbName();
    return CapacitorSQLite.query({
      database: dbname,
      statement: sql,
      values: [] // necesario para android
    }).then((response: capSQLiteValues) => {
      let usuarios= [];

      if (this.isIos && response.values.length > 0) {
        response.values.shift();
      }
      for (let index = 0; index < response.values.length; index++) {
        const usuario = response.values[index];
        usuarios.push(usuario);
      }
      return usuarios;
    }).catch(err => Promise.reject(err))
  }





   


}

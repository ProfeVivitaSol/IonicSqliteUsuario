import { Component, OnInit } from '@angular/core';
import { SqliteService } from '../services/sqlite.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  
  public rut: string;
  public email: string;
  public password: string;
  public usuarios=[];

  constructor(private sqliteservice: SqliteService) {}

  ngOnInit(){
    this.read();
  }


  create(){
    this.sqliteservice.create(this.rut, this.email, this.password).then( (changes) =>{
      console.log(changes);
      console.log("Creado");
      this.rut='';
      this.email = '';
      this.password='';
      this.read(); // Volvemos a leer
    }).catch(err => {
      console.error(err);
      console.error("Error al crear");
    })
  }

  read(){
    this.sqliteservice.read().then( (data: string[]) => {
      this.usuarios = data;
      console.log("Leido");
      console.log(this.usuarios);
    }).catch(err => {
      console.error(err);
      console.error("Error al leer");
    })
  }
}

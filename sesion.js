/* Sesión del equipo South Tennis con Supabase Auth.
   La usan index.html (gestión) y productos.html. Las contraseñas viven solo en Supabase
   (Authentication → Users); aquí solo se relaciona cada usuario con su correo y su permiso.
   La sesión queda guardada en este navegador hasta que se pulse "Salir". */
const ST_SB='https://imjdjitpxuwulpsgezdf.supabase.co';
const ST_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltamRqaXRweHV3dWxwc2dlemRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTA3NjgsImV4cCI6MjA5Njc2Njc2OH0.Qz0uaCqGumORrkq0UNXcXnmG-hjTgiYMDxCM_I-AU2M';
const ST_USERS=[
  {usuario:'ismaelpinto',email:'ismaelpinto@southtennis.co',permiso:'administrador'},
  {usuario:'lauratirado',email:'lauratirado@southtennis.co',permiso:'vendedor'},
];
const ST_LS='st_auth';

const Sesion={
  data:null,          // {usuario,permiso,access_token,refresh_token,expires_at}
  alExpirar:null,     // lo define cada página: qué hacer si la sesión ya no se puede renovar
  _renovando:null,

  cargar(){
    try{
      const d=JSON.parse(localStorage.getItem(ST_LS)||'null');
      if(d&&d.refresh_token&&ST_USERS.some(u=>u.usuario===d.usuario))this.data=d;
    }catch(e){}
    return this.data;
  },
  _guardar(u,t){
    this.data={usuario:u.usuario,permiso:u.permiso,access_token:t.access_token,refresh_token:t.refresh_token,expires_at:Date.now()+(t.expires_in||3600)*1000};
    try{localStorage.setItem(ST_LS,JSON.stringify(this.data))}catch(e){}
  },
  async _token(grant,body){
    const r=await fetch(`${ST_SB}/auth/v1/token?grant_type=${grant}`,{method:'POST',headers:{apikey:ST_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error_description||j.msg||j.message||('Error '+r.status));
    return j;
  },
  async entrar(usuario,clave){
    const u=ST_USERS.find(x=>x.usuario===String(usuario).trim().toLowerCase());
    if(!u)throw new Error('Usuario o contraseña incorrectos');
    try{this._guardar(u,await this._token('password',{email:u.email,password:clave}))}
    catch(e){throw new Error(/fetch|network/i.test(e.message)?'Sin conexión. Intenta de nuevo.':'Usuario o contraseña incorrectos')}
    return this.data;
  },
  renovar(){
    if(!this.data)return Promise.resolve(false);
    // varias peticiones a la vez comparten una sola renovación
    if(!this._renovando)this._renovando=(async()=>{
      try{
        const u=ST_USERS.find(x=>x.usuario===this.data.usuario);
        this._guardar(u,await this._token('refresh_token',{refresh_token:this.data.refresh_token}));
        return true;
      }catch(e){
        this.salir(true);
        if(this.alExpirar)this.alExpirar();
        return false;
      }finally{this._renovando=null}
    })();
    return this._renovando;
  },
  salir(soloLocal){
    const t=this.data&&this.data.access_token;
    this.data=null;
    try{localStorage.removeItem(ST_LS)}catch(e){}
    if(t&&!soloLocal)fetch(`${ST_SB}/auth/v1/logout`,{method:'POST',headers:{apikey:ST_KEY,Authorization:'Bearer '+t}}).catch(()=>{});
  },
  async headers(){
    if(this.data&&Date.now()>this.data.expires_at-60000)await this.renovar();
    return{apikey:ST_KEY,Authorization:'Bearer '+(this.data?this.data.access_token:ST_KEY)};
  },
  /* fetch con la sesión; si el token venció, lo renueva y reintenta una vez */
  async fetch(url,opt={}){
    let r=await fetch(url,{...opt,headers:{...(opt.headers||{}),...await this.headers()}});
    if(r.status===401&&this.data&&await this.renovar())r=await fetch(url,{...opt,headers:{...(opt.headers||{}),...await this.headers()}});
    return r;
  },
};

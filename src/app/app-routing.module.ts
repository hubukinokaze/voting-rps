import { NgModule }             from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent }         from './app.component';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    // canActivate: [AuthGuard],
    data: { title: 'Voting RPS' }
  }, {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  }
  // {
  //   path: '**',
  //   component: PageNotFoundComponent,
  //   data: {title: 'Page Not Found'}
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

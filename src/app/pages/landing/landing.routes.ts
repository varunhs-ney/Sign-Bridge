import {Routes} from '@angular/router';
import {AboutComponent} from './about/about.component';





export const routes: Routes = [
  {
    path: '',
  
    children: [
      {path: '', component: AboutComponent},
      {path: 'about', redirectTo: ''},
      
      
    ],
  },
];

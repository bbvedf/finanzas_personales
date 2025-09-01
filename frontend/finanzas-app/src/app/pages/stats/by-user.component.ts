import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
    selector: 'app-by-user',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './by-user.component.html',
    styleUrls: ['./by-user.component.scss']
})
export class ByUserComponent implements OnInit {
    @Input() showBackButton: boolean = true;
    chartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ label: 'Total por usuario', data: [] }]
    };
    chartOptions: ChartOptions<'bar'> = { responsive: true };
    chartType: 'bar' = 'bar';

    constructor(
        private statsService: StatsService,
        private router: Router
    ) { }

    goBack() {
        this.router.navigate(['/stats']);
    }

    ngOnInit(): void {
        this.statsService.getByUser().subscribe(data => {
            console.log('byUser data', data);
            this.chartData = {
                labels: data.map(d => d.username),
                datasets: [
                    {
                        label: 'Total por usuario',
                        data: data.map(d => d.total)
                    }
                ]
            };
        });
    }

}

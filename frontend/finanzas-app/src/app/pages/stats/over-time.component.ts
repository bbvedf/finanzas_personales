import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

@Component({
    selector: 'app-over-time',
    standalone: true,
    imports: [CommonModule, NgChartsModule],
    templateUrl: './over-time.component.html',
    styleUrls: ['./over-time.component.scss']
})
export class OverTimeComponent implements OnInit {
    @Input() showBackButton: boolean = true;

    chartData: ChartData<'line'> = {
        labels: [],
        datasets: [{ label: 'Total mensual', data: [], fill: false, borderColor: 'blue' }]
    };
    chartOptions: ChartOptions<'line'> = { responsive: true };
    chartType: 'line' = 'line';

    constructor(
        private statsService: StatsService,
        private router: Router
    ) { }

    goBack() {
        this.router.navigate(['/stats']);
    }

    ngOnInit(): void {
        this.statsService.getOverTime().subscribe(data => {
            //console.log('overtime data', data);
            this.chartData = {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'Total mensual',
                        data: data.map(d => d.total),
                        fill: false,
                        borderColor: 'blue'
                    }
                ]
            };
        });
    }
}

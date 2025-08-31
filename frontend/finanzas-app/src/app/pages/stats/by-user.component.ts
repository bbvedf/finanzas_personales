import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    chartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ label: 'Total por usuario', data: [] }]
    };
    chartOptions: ChartOptions<'bar'> = { responsive: true };
    chartType: 'bar' = 'bar';

    constructor(private statsService: StatsService) { }

    ngOnInit(): void {
        this.statsService.getByUser().subscribe(data => {
            //console.log('byUser data', data);
            this.chartData = {
                labels: data.map(d => d.user_id),
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

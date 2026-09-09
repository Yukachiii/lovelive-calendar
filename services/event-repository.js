/**
 * イベント取得元が実装する共通インターフェース:
 * listEvents(): Promise<Event[]>
 *
 * 将来APIを追加するときは、このメソッドを持つ別のRepositoryを実装し、
 * app.jsのinitializeへ渡します。
 */
export class StaticEventRepository {
  constructor(events) {
    this.events = events;
  }

  async listEvents() {
    return this.events.map(event => ({
      ...event,
      cast: Array.isArray(event.cast) ? [...event.cast] : event.cast,
      series: Array.isArray(event.series) ? [...event.series] : [],
      venue: event.venue ? { ...event.venue } : event.venue
    }));
  }
}

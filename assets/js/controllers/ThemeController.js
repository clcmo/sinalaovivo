export class ThemeController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this._renderAndApply();
  }

  _renderAndApply() {
    this.view.render(this.model.list(), this.model.get(), id => this._select(id));
    this.view.apply(this.model.get());
  }

  _select(id) {
    this.model.set(id);
    this._renderAndApply();
  }
}

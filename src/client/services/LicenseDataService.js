function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

export class LicenseDataService {

  static _getHeaders() {
    const token = window.g_ck || getCookie('glide_user_activity');
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-UserToken': token
    };
  }

  static _handleResponseError(response) {
    if (response.status === 401) throw new Error('Nicht eingeloggt oder fehlende Rolle');
    if (response.status === 403) throw new Error('Rolle fehlt');
    throw new Error('ServiceNow API error: ' + response.status);
  }

  /**
   * Holt Lizenzdaten aus drei Tabellen:
   * 1. u_usage_software_license  → Mapping User ↔ Produkt + Last Usage
   * 2. u_software_license        → Produktstammdaten
   * Filtert nach employeeId (= u_id_user in u_usage_software_license)
   */
  static async _fetchFromServiceNow(employeeId = null) {
    const headers = this._getHeaders();

    // ── Schritt 1: Nutzungsdaten für diesen Mitarbeiter ─────────────────────
    let usageUrl = '/api/now/table/u_usage_software_license' +
      '?sysparm_fields=u_id_product,u_id_user,u_last_usage' +
      '&sysparm_limit=1000';

    if (employeeId) {
      usageUrl += `&sysparm_query=u_id_user=${encodeURIComponent(employeeId)}`;
    }

    const usageResp = await fetch(usageUrl, { headers });
    if (!usageResp.ok) this._handleResponseError(usageResp);
    const usageData = await usageResp.json();
    const usageRecords = usageData.result || [];

    if (usageRecords.length === 0) return [];

    // ── Schritt 2: Eindeutige Produkt-IDs sammeln ────────────────────────────
    const productIds = [...new Set(
      usageRecords
        .map(r => r.u_id_product?.value ?? r.u_id_product ?? '')
        .filter(Boolean)
    )];

    // ── Schritt 3: Produktstammdaten in einem einzigen API-Call holen ────────
    const productQuery = productIds
      .map(id => `u_id_product=${encodeURIComponent(id)}`)
      .join('^OR');

    const productUrl = '/api/now/table/u_software_license' +
      '?sysparm_fields=u_id_product,u_product,u_status,u_cost,u_manufacturer_id,u_manufacturer_name,u_import_id' +
      `&sysparm_query=${productQuery}` +
      '&sysparm_limit=1000';

    const productResp = await fetch(productUrl, { headers });
    if (!productResp.ok) this._handleResponseError(productResp);
    const productData = await productResp.json();
    const products = productData.result || [];

    // ── Schritt 4: Produkt-Map aufbauen ──────────────────────────────────────
    const productMap = {};
    products.forEach(p => {
      const pid = p.u_id_product?.value ?? p.u_id_product ?? '';
      productMap[pid] = p;
    });

    // ── Schritt 5: Usage + Produktdaten zusammenführen ───────────────────────
    return usageRecords.map(u => {
      const pid     = u.u_id_product?.value ?? u.u_id_product ?? '';
      const product = productMap[pid] || {};

      const cost = (() => {
        const raw     = String(product.u_cost?.value ?? product.u_cost ?? '0');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        return cleaned ? parseFloat(cleaned) : 0;
      })();

      return {
        id:               pid,
        name:             product.u_product?.display_value   ?? product.u_product          ?? '',
        date:             (u.u_last_usage?.display_value     ?? u.u_last_usage              ?? '').split(' ')[0],
        status:           product.u_status?.display_value    ?? product.u_status            ?? '',
        employeeId:       u.u_id_user?.value                 ?? u.u_id_user                 ?? '',
        cost,
        manufacturerId:   product.u_manufacturer_id?.value   ?? product.u_manufacturer_id   ?? '',
        manufacturerName: product.u_manufacturer_name?.value ?? product.u_manufacturer_name ?? '',
      };
    });
  }

  /**
   * Login-Validierung: Prüft ob der User in sys_user existiert,
   * dann ob er Lizenzen hat.
   */
  static async getLicensesByEmployee(employeeId) {
    const headers = this._getHeaders();

    const userUrl = '/api/now/table/sys_user' +
      `?sysparm_query=employee_number=${encodeURIComponent(employeeId)}` +
      '&sysparm_fields=employee_number,name&sysparm_limit=1';

    const userResp = await fetch(userUrl, { headers });
    if (!userResp.ok) this._handleResponseError(userResp);
    const userData = await userResp.json();

    if (!userData.result || userData.result.length === 0) return [];

    const licenses = await this._fetchFromServiceNow(employeeId);
    console.log('Gefundene Lizenzen:', licenses.length, licenses[0]);
    return licenses;
  }

  /**
   * Prüft welche Lizenzen für diesen Mitarbeiter bereits einen
   * offenen Rückgabe-Incident haben → gibt ein Set von Lizenz-IDs zurück.
   */
  static async getExistingReturnRequests(employeeId) {
    const headers = this._getHeaders();

    const url = '/api/now/table/incident' +
      '?sysparm_fields=number,description,state' +
      `&sysparm_query=short_description=License Return Request` +
      `^descriptionCONTAINSEmployee ID ${encodeURIComponent(employeeId)}` +
      `^stateNOT IN6,7` +
      '&sysparm_limit=200';

    const resp = await fetch(url, { headers });
    if (!resp.ok) return new Set();
    const data = await resp.json();

    const returnedIds = new Set();
    (data.result || []).forEach(inc => {
      const desc  = inc.description?.value ?? inc.description ?? '';
      const match = desc.match(/\(ID:\s*(\S+?)\)/);
      if (match) returnedIds.add(match[1]);
    });

    return returnedIds;
  }

  static async getAllLicenses(employeeId = null) {
    const licenses = await this._fetchFromServiceNow(employeeId);
    return licenses.map(l => ({ ...l, cost: `$${l.cost.toFixed(2)}` }));
  }

  static async getLicenseCount(employeeId = null) {
    const licenses = await this._fetchFromServiceNow(employeeId);
    return licenses.length;
  }

  static async getTotalCost(employeeId = null) {
    const licenses = await this._fetchFromServiceNow(employeeId);
    return licenses.reduce((sum, l) => sum + l.cost, 0);
  }

  static async getTotalCostFormatted(employeeId = null) {
    const total = await this.getTotalCost(employeeId);
    return `$${total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  static async getLicensesForReturn(employeeId = null) {
    const licenses = await this._fetchFromServiceNow(employeeId);
    return licenses.map(l => ({ ...l, cost: `$${l.cost.toFixed(2)}` }));
  }

  static async getHomepageLicenses(employeeId = null, limit = 2) {
    const licenses = await this.getAllLicenses(employeeId);
    return licenses.slice(0, limit);
  }

  static async getMonthlyCosts(employeeId = null) {
    const totalCost = await this.getTotalCost(employeeId);
    return [
      { month: 'Aug', value: Math.round(totalCost * 0.75) },
      { month: 'Sep', value: Math.round(totalCost * 0.95) },
      { month: 'Oct', value: Math.round(totalCost * 0.85) },
      { month: 'Nov', value: Math.round(totalCost) },
      { month: 'Dec', value: Math.round(totalCost * 1.05) }
    ];
  }

  static async getLineChartData(employeeId = null) {
    const total = await this.getTotalCost(employeeId);
    const base  = total / 100;
    return {
      main:       [0.45, 0.52, 0.48, 0.65, 0.59, 0.73].map(f => Math.round(base * f)),
      comparison: [0.38, 0.45, 0.42, 0.58, 0.52, 0.65].map(f => Math.round(base * f))
    };
  }

  static async getCostGrowth(employeeId = null) {
    const monthly  = await this.getMonthlyCosts(employeeId);
    const current  = monthly[monthly.length - 2].value;
    const previous = monthly[monthly.length - 3].value;
    const growth   = ((current - previous) / previous) * 100;
    return `${growth > 0 ? '+' : ''}${growth.toFixed(0)}%`;
  }
}

import { query } from '../../config/db.js'

export async function getFacilityTree(req, res, next) {
  try {
    const orgId = req.user.role === 'admin' ? (req.query.orgId || 1) : req.user.org_id

    const result = await query(
      `SELECT * FROM facility_nodes WHERE org_id = $1 ORDER BY sort_order ASC, name ASC`,
      [orgId]
    )

    // Build hierarchical tree in memory
    const nodes = result.rows
    const nodeMap = {}
    const rootNodes = []

    nodes.forEach(n => {
      nodeMap[n.id] = { ...n, children: [] }
    })

    nodes.forEach(n => {
      if (n.parent_id && nodeMap[n.parent_id]) {
        nodeMap[n.parent_id].children.push(nodeMap[n.id])
      } else {
        rootNodes.push(nodeMap[n.id])
      }
    })

    res.json({ orgId, tree: rootNodes, raw: nodes })
  } catch (err) {
    next(err)
  }
}

export async function syncFacilityTree(req, res, next) {
  try {
    const { orgId, tree = [] } = req.body
    const targetOrgId = req.user.role === 'admin' ? (orgId || 1) : req.user.org_id

    // Flatten tree nodes for relational storage
    const flatNodes = []
    function flatten(list, parentId = null) {
      list.forEach((item, index) => {
        const id = item.id || `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        flatNodes.push({
          id,
          org_id: targetOrgId,
          parent_id: parentId,
          name: item.name || 'Unnamed',
          node_type: item.type || item.node_type || 'Building',
          device_id: item.deviceId || null,
          sort_order: index,
        })
        if (item.children && Array.isArray(item.children)) {
          flatten(item.children, id)
        }
      })
    }
    flatten(tree)

    // Clear existing nodes for org and bulk insert
    await query(`DELETE FROM facility_nodes WHERE org_id = $1`, [targetOrgId])

    for (const node of flatNodes) {
      await query(
        `INSERT INTO facility_nodes (id, org_id, parent_id, name, node_type, device_id, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [node.id, node.org_id, node.parent_id, node.name, node.node_type, node.device_id, node.sort_order]
      )
    }

    res.json({ success: true, count: flatNodes.length, orgId: targetOrgId })
  } catch (err) {
    next(err)
  }
}

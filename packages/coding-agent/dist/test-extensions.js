/**
 * Test script for extension system
 */
import { createExtensionRegistry } from "./core/extensions/index.js";
async function testExtensionSystem() {
    console.log("=== Extension System Test ===\n");
    // Create registry
    const registry = createExtensionRegistry("/tmp/test-axiom-extensions");
    // 1. Test adding a tool manually
    console.log("1. Registering a test tool...");
    registry.registerTool({
        name: "test_tool",
        label: "Test Tool",
        description: "A test tool",
        parameters: { type: "object", properties: {} },
        async execute() {
            return {
                content: [{ type: "text", text: "Test executed!" }],
                details: {},
            };
        },
    });
    console.log(`   Tools: ${registry.getToolNames().join(", ")}`);
    // 2. Test creating an extension with code
    console.log("\n2. Creating an extension with code...");
    const ext = await registry.createExtension({
        name: "hello_world",
        label: "Hello World",
        description: "Prints a greeting",
        parameterSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Name to greet" },
            },
        },
        code: `
			const greeting = "Hello, " + (params.name || "World") + "!";
			return {
				content: [{ type: "text", text: greeting }],
				details: { greeting }
			};
		`,
    });
    console.log(`   Created: ${ext.name}`);
    // 3. Test executing the extension
    console.log("\n3. Executing hello_world extension...");
    const helloTool = registry.getTool("hello_world");
    if (helloTool) {
        const result = await helloTool.execute("test-id", { name: "Axiom" });
        console.log(`   Result: ${result.content[0].text}`);
    }
    // 4. Test listing extensions
    console.log("\n4. Listing all extensions...");
    const extensions = await registry.listExtensions();
    console.log(`   Found ${extensions.length} extensions:`);
    for (const e of extensions) {
        console.log(`   - ${e.name}: ${e.label}`);
    }
    // 5. Test removing extension
    console.log("\n5. Removing test_tool...");
    registry.unregisterTool("test_tool");
    console.log(`   Tools after removal: ${registry.getToolNames().join(", ")}`);
    // 6. Test listener notification
    console.log("\n6. Testing listener notifications...");
    const listenerCalled = new Promise((resolve) => {
        registry.onToolsChange((tools) => {
            console.log(`   Listener called with ${tools.length} tools`);
            resolve(true);
        });
        registry.registerTool({
            name: "listener_test",
            label: "Listener Test",
            description: "Test listener",
            parameters: { type: "object", properties: {} },
            async execute() {
                return { content: [], details: {} };
            },
        });
    });
    await listenerCalled;
    // 7. Test reload
    console.log("\n7. Testing reload...");
    // Create a new registry pointing to same dir
    const registry2 = createExtensionRegistry("/tmp/test-axiom-extensions");
    await registry2.loadAllExtensions();
    console.log(`   Reloaded tools: ${registry2.getToolNames().join(", ")}`);
    console.log("\n=== All tests passed! ===");
}
testExtensionSystem().catch(console.error);
//# sourceMappingURL=test-extensions.js.map